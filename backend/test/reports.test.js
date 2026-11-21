const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startApp } = require('./helpers');

describe('reports', () => {
  let app;
  let admin;
  let operator;
  let productId;
  let otherId;

  before(async () => {
    app = await startApp();
    admin = await app.login('admin', 'admin-demo-123');
    operator = await app.login('operator', 'operator-demo-123');

    const make = async (sku) =>
      (
        await app.request('POST', '/products', {
          token: admin,
          body: { name: `Report ${sku}`, sku, supplierId: 1, catalogPrice: '10.00', minStock: 0 },
        })
      ).body.id;
    productId = await make('REP-1');
    otherId = await make('REP-2');

    let sequence = 800000;
    const post = async (type, postedAt, lines) => {
      sequence += 1;
      const supplier = type === 'receipt';
      const counterparty = type === 'shipment';
      const [{ id }] = await app.dataSource.query(
        `INSERT INTO stock_movements
           (number, type, posted_at, supplier_id, supplier_name, counterparty_id, counterparty_name, reason, created_by_id, created_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 'admin') RETURNING id`,
        [
          `X-${sequence}`,
          type,
          postedAt,
          supplier ? 1 : null,
          supplier ? 'Northwind Traders' : null,
          counterparty ? 1 : null,
          counterparty ? 'Riverside Retail' : null,
          type === 'write_off' ? 'Test reason' : null,
        ],
      );
      for (const [id_, name, quantity, unitCost, valueDelta] of lines) {
        const sign = type === 'receipt' ? 1 : -1;
        await app.dataSource.query(
          `INSERT INTO stock_movement_lines
             (movement_id, product_id, product_name, sku, quantity, unit_cost, quantity_delta, value_delta)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, id_, name, `SKU-${id_}`, quantity, unitCost, sign * quantity, valueDelta],
        );
      }
    };

    await post('receipt', '2026-01-10T12:00:00Z', [[productId, 'Old name', 10, '10.00', '100.0000']]);
    await post('receipt', '2026-01-20T23:59:59Z', [
      [productId, 'Old name', 10, '20.00', '200.0000'],
      [otherId, 'Other', 4, '5.00', '20.0000'],
    ]);
    await post('shipment', '2026-02-01T00:00:00Z', [[productId, 'New name', 5, '15.0000', '-75.0000']]);
    await post('write_off', '2026-02-03T08:00:00Z', [[productId, 'New name', 15, '15.0000', '-225.0000']]);
  });

  after(async () => {
    await app.close();
  });

  const asOf = async (date) => (await app.request('GET', `/reports/inventory-as-of?date=${date}`, { token: operator })).body;
  const row = (report) => report.items.find((item) => item.productId === productId);

  it('reports historical quantity, unit cost and value for UTC day boundaries', async () => {
    assert.equal(row(await asOf('2026-01-09')), undefined);

    const first = row(await asOf('2026-01-10'));
    assert.deepEqual([first.quantity, first.unitCost, first.value], [10, '10.0000', '100.0000']);

    const edge = row(await asOf('2026-01-20'));
    assert.deepEqual([edge.quantity, edge.unitCost, edge.value], [20, '15.0000', '300.0000']);

    const shippedDay = row(await asOf('2026-02-01'));
    assert.deepEqual([shippedDay.quantity, shippedDay.unitCost, shippedDay.value], [15, '15.0000', '225.0000']);

    const empty = row(await asOf('2026-02-03'));
    assert.deepEqual([empty.quantity, empty.unitCost, empty.value], [0, '0.0000', '0.0000']);
  });

  it('uses the product name and SKU stored at the cutoff', async () => {
    assert.equal(row(await asOf('2026-01-31')).name, 'Old name');
    assert.equal(row(await asOf('2026-02-01')).name, 'New name');
  });

  it('values stock from ledger costs with a grand total and ignores catalog price changes', async () => {
    await app.request('PATCH', `/products/${productId}`, { token: admin, body: { catalogPrice: '999.00' } });
    const url = '/reports/inventory-valuation?date=2026-02-01';
    const report = (await app.request('GET', url, { token: operator })).body;
    const item = report.items.find((entry) => entry.productId === productId);
    assert.deepEqual([item.quantity, item.value], [15, '225.0000']);
    const other = report.items.find((entry) => entry.productId === otherId);
    assert.equal(other.value, '20.0000');

    const sum = report.items.reduce((total, entry) => total + Number(entry.value), 0);
    assert.equal(Number(report.totalValue), sum);

    const later = (await app.request('GET', '/reports/inventory-valuation?date=2026-02-03', { token: operator })).body;
    assert.ok(!later.items.some((entry) => entry.productId === productId));
  });

  it('shows daily movement dynamics with zero days and an optional product filter', async () => {
    const url = `/reports/movement-dynamics?dateFrom=2026-01-01&dateTo=2026-02-05&productId=${productId}`;
    const report = (await app.request('GET', url, { token: operator })).body;
    assert.equal(report.items.length, 36);
    const day = (date) => report.items.find((entry) => entry.date === date);
    assert.deepEqual(day('2026-01-10'), { date: '2026-01-10', received: 10, shipped: 0, writtenOff: 0 });
    assert.equal(day('2026-01-20').received, 10);
    assert.equal(day('2026-02-01').shipped, 5);
    assert.equal(day('2026-02-03').writtenOff, 15);
    assert.equal(day('2026-01-15').received, 0);
    assert.deepEqual(report.totals, { received: 20, shipped: 5, writtenOff: 15 });

    const all = (await app.request('GET', '/reports/movement-dynamics?dateFrom=2026-01-20&dateTo=2026-01-20', { token: operator })).body;
    assert.equal(all.items[0].received, 14);
    assert.equal(all.productId, null);
  });

  it('validates dates and permissions', async () => {
    const bad = [
      '/reports/inventory-as-of',
      '/reports/inventory-as-of?date=2026-02-31',
      '/reports/inventory-as-of?date=yesterday',
      '/reports/inventory-valuation?date=2026-13-01',
      '/reports/movement-dynamics?dateFrom=2026-02-05&dateTo=2026-02-01',
      '/reports/movement-dynamics?dateFrom=2025-01-01&dateTo=2026-12-31',
      '/reports/movement-dynamics?dateFrom=2026-01-01',
      '/reports/movement-dynamics?dateFrom=2026-01-01&dateTo=2026-01-02&productId=abc',
    ];
    for (const path of bad) {
      assert.equal((await app.request('GET', path, { token: operator })).status, 400, path);
    }
    assert.equal((await app.request('GET', '/reports/inventory-as-of?date=2026-01-01')).status, 401);
  });
});
