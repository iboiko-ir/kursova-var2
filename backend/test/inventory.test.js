const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startApp } = require('./helpers');

describe('inventory movements', () => {
  let app;
  let admin;
  let operator;
  let skuCounter = 0;

  before(async () => {
    app = await startApp();
    admin = await app.login('admin', 'admin-demo-123');
    operator = await app.login('operator', 'operator-demo-123');
  });

  after(async () => {
    await app.close();
  });

  async function createProduct(overrides = {}) {
    skuCounter += 1;
    const result = await app.request('POST', '/products', {
      token: admin,
      body: { name: `Test product ${skuCounter}`, sku: `T-${skuCounter}`, supplierId: 1, catalogPrice: '10.00', minStock: 0, ...overrides },
    });
    assert.equal(result.status, 201, JSON.stringify(result.body));
    return result.body;
  }

  const receipt = (lines, token = operator) =>
    app.request('POST', '/movements', { token, body: { type: 'receipt', supplierId: 1, lines } });
  const shipment = (lines, token = operator) =>
    app.request('POST', '/movements', { token, body: { type: 'shipment', counterpartyId: 1, lines } });
  const writeOff = (lines, reason = 'Damaged', token = operator) =>
    app.request('POST', '/movements', { token, body: { type: 'write_off', reason, lines } });
  const product = async (id) => (await app.request('GET', `/products/${id}`, { token: admin })).body;
  const stock = async (id) => {
    const { quantity, inventoryValue } = await product(id);
    return { quantity, inventoryValue };
  };
  const counts = async () => {
    const [row] = await app.dataSource.query(
      `SELECT (SELECT count(*)::int FROM stock_movements) AS movements,
              (SELECT count(*)::int FROM stock_movement_lines) AS lines,
              (SELECT count(*)::int FROM notifications) AS notifications`,
    );
    return row;
  };
  const activeNotifications = (productId) =>
    app.dataSource.query("SELECT * FROM notifications WHERE product_id = $1 AND status = 'active'", [productId]);

  it('increases stock on receipt and decreases it at weighted-average cost', async () => {
    const item = await createProduct({ minStock: 5 });

    const first = await receipt([{ productId: item.id, quantity: 10, unitCost: '10.00' }]);
    assert.equal(first.status, 201);
    assert.match(first.body.number, /^RN-\d{6}$/);
    assert.equal(first.body.lines[0].valueDelta, '100.0000');
    await receipt([{ productId: item.id, quantity: 10, unitCost: 20 }]);
    assert.deepEqual(await stock(item.id), { quantity: 20, inventoryValue: '300.0000' });

    const shipped = await shipment([{ productId: item.id, quantity: 5 }]);
    assert.equal(shipped.status, 201);
    assert.match(shipped.body.number, /^SN-\d{6}$/);
    assert.equal(shipped.body.lines[0].unitCost, '15.0000');
    assert.equal(shipped.body.lines[0].valueDelta, '-75.0000');
    assert.equal(shipped.body.lines[0].quantityDelta, -5);
    assert.deepEqual(await stock(item.id), { quantity: 15, inventoryValue: '225.0000' });

    const written = await writeOff([{ productId: item.id, quantity: 5 }]);
    assert.match(written.body.number, /^WO-\d{6}$/);
    assert.deepEqual(await stock(item.id), { quantity: 10, inventoryValue: '150.0000' });

    await shipment([{ productId: item.id, quantity: 10 }]);
    assert.deepEqual(await stock(item.id), { quantity: 0, inventoryValue: '0.0000' });
  });

  it('removes all remaining value when stock reaches zero after rounding', async () => {
    const item = await createProduct();
    await receipt([{ productId: item.id, quantity: 3, unitCost: '1.00' }]);
    await receipt([{ productId: item.id, quantity: 4, unitCost: '1.01' }]);
    assert.deepEqual(await stock(item.id), { quantity: 7, inventoryValue: '7.0400' });

    const partial = await shipment([{ productId: item.id, quantity: 2 }]);
    assert.equal(partial.body.lines[0].valueDelta, '-2.0114');
    assert.deepEqual(await stock(item.id), { quantity: 5, inventoryValue: '5.0286' });

    await writeOff([{ productId: item.id, quantity: 5 }]);
    assert.deepEqual(await stock(item.id), { quantity: 0, inventoryValue: '0.0000' });

    const [sums] = await app.dataSource.query(
      'SELECT sum(quantity_delta)::int AS quantity, sum(value_delta)::text AS value FROM stock_movement_lines WHERE product_id = $1',
      [item.id],
    );
    assert.equal(sums.quantity, 0);
    assert.equal(Number(sums.value), 0);
  });

  it('uses the catalog price when a receipt has no unit cost and keeps history after price changes', async () => {
    const item = await createProduct({ catalogPrice: '8.00' });
    const posted = await receipt([{ productId: item.id, quantity: 5 }]);
    assert.equal(posted.body.lines[0].unitCost, '8.0000');

    await app.request('PATCH', `/products/${item.id}`, { token: admin, body: { catalogPrice: '99.00', name: 'Renamed' } });
    await app.request('PATCH', '/suppliers/1', { token: admin, body: { name: 'Renamed Supplier' } });
    const detail = await app.request('GET', `/movements/${posted.body.id}`, { token: operator });
    assert.equal(detail.body.lines[0].unitCost, '8.0000');
    assert.equal(detail.body.lines[0].productName, item.name);
    assert.equal(detail.body.supplier.name, 'Northwind Traders');
    assert.equal(detail.body.totalValue, '40.0000');
    assert.equal((await stock(item.id)).inventoryValue, '40.0000');
  });

  it('rejects invalid movements without changing anything', async () => {
    const a = await createProduct();
    const b = await createProduct();
    await receipt([{ productId: a.id, quantity: 5, unitCost: '2.00' }]);
    await receipt([{ productId: b.id, quantity: 2, unitCost: '2.00' }]);
    const before = await counts();
    const stockBefore = [await stock(a.id), await stock(b.id)];

    const insufficient = await shipment([
      { productId: a.id, quantity: 3 },
      { productId: b.id, quantity: 3 },
    ]);
    assert.equal(insufficient.status, 409);
    assert.match(insufficient.body.message, /Insufficient stock/);

    const unknown = await receipt([
      { productId: a.id, quantity: 1 },
      { productId: 99999, quantity: 1 },
    ]);
    assert.equal(unknown.status, 400);

    const rejected = [
      await receipt([{ productId: a.id, quantity: 1 }, { productId: a.id, quantity: 2 }]),
      await receipt([{ productId: a.id, quantity: 0 }]),
      await receipt([{ productId: a.id, quantity: 1.5 }]),
      await receipt([]),
      await receipt([{ productId: a.id, quantity: 1, unitCost: '-1' }]),
      await shipment([{ productId: a.id, quantity: 1, unitCost: '1.00' }]),
      await app.request('POST', '/movements', { token: operator, body: { type: 'shipment', lines: [{ productId: a.id, quantity: 1 }] } }),
      await app.request('POST', '/movements', { token: operator, body: { type: 'receipt', lines: [{ productId: a.id, quantity: 1 }] } }),
      await app.request('POST', '/movements', { token: operator, body: { type: 'write_off', lines: [{ productId: a.id, quantity: 1 }] } }),
      await app.request('POST', '/movements', { token: operator, body: { type: 'write_off', reason: '   ', lines: [{ productId: a.id, quantity: 1 }] } }),
      await app.request('POST', '/movements', { token: operator, body: { type: 'receipt', supplierId: 1, reason: 'x', lines: [{ productId: a.id, quantity: 1 }] } }),
      await app.request('POST', '/movements', { token: operator, body: { type: 'transfer', lines: [{ productId: a.id, quantity: 1 }] } }),
    ];
    rejected.forEach((result, index) => assert.equal(result.status, 400, `case ${index}: ${JSON.stringify(result.body)}`));

    assert.deepEqual(await counts(), before);
    assert.deepEqual([await stock(a.id), await stock(b.id)], stockBefore);
  });

  it('does not allow archived products or parties in new movements', async () => {
    const item = await createProduct();
    await app.request('POST', `/products/${item.id}/archive`, { token: admin });
    assert.equal((await receipt([{ productId: item.id, quantity: 1 }])).status, 400);

    const party = await app.request('POST', '/counterparties', { token: admin, body: { name: 'Archived Buyer' } });
    await app.request('POST', `/counterparties/${party.body.id}/archive`, { token: admin });
    const live = await createProduct();
    await receipt([{ productId: live.id, quantity: 5 }]);
    const result = await app.request('POST', '/movements', {
      token: operator,
      body: { type: 'shipment', counterpartyId: party.body.id, lines: [{ productId: live.id, quantity: 1 }] },
    });
    assert.equal(result.status, 400);
  });

  it('never makes stock negative under concurrent shipments', async () => {
    const item = await createProduct();
    await receipt([{ productId: item.id, quantity: 10, unitCost: '3.00' }]);

    const results = await Promise.all(
      Array.from({ length: 8 }, () => shipment([{ productId: item.id, quantity: 3 }])),
    );
    const ok = results.filter((result) => result.status === 201).length;
    assert.equal(ok, 3);
    assert.ok(results.filter((result) => result.status !== 201).every((result) => result.status === 409));
    assert.deepEqual(await stock(item.id), { quantity: 1, inventoryValue: '3.0000' });
  });

  it('avoids deadlocks when documents list products in opposite order', async () => {
    const a = await createProduct();
    const b = await createProduct();
    await receipt([
      { productId: a.id, quantity: 100 },
      { productId: b.id, quantity: 100 },
    ]);
    const jobs = [];
    for (let index = 0; index < 6; index += 1) {
      const lines =
        index % 2 === 0
          ? [{ productId: a.id, quantity: 1 }, { productId: b.id, quantity: 1 }]
          : [{ productId: b.id, quantity: 1 }, { productId: a.id, quantity: 1 }];
      jobs.push(shipment(lines));
    }
    const results = await Promise.all(jobs);
    assert.ok(results.every((result) => result.status === 201), JSON.stringify(results.map((r) => r.status)));
    assert.equal((await stock(a.id)).quantity, 94);
    assert.equal((await stock(b.id)).quantity, 94);
    const numbers = new Set(results.map((result) => result.body.number));
    assert.equal(numbers.size, 6);
  });

  it('creates, updates, deduplicates and resolves low-stock notifications', async () => {
    const item = await createProduct({ minStock: 5 });
    let active = await activeNotifications(item.id);
    assert.equal(active.length, 1);
    assert.equal(active[0].quantity, 0);

    await receipt([{ productId: item.id, quantity: 3 }]);
    active = await activeNotifications(item.id);
    assert.equal(active.length, 1);
    assert.equal(active[0].quantity, 3);

    await app.request('GET', '/notifications', { token: operator });
    await app.request('GET', '/notifications', { token: operator });
    assert.equal((await activeNotifications(item.id)).length, 1);

    await receipt([{ productId: item.id, quantity: 10 }]);
    assert.equal((await activeNotifications(item.id)).length, 0);

    await shipment([{ productId: item.id, quantity: 9 }]);
    active = await activeNotifications(item.id);
    assert.equal(active.length, 1);
    assert.equal(active[0].quantity, 4);

    await app.request('PATCH', `/products/${item.id}`, { token: admin, body: { minStock: 2 } });
    assert.equal((await activeNotifications(item.id)).length, 0);
    await app.request('PATCH', `/products/${item.id}`, { token: admin, body: { minStock: 10 } });
    active = await activeNotifications(item.id);
    assert.equal(active.length, 1);
    assert.equal(active[0].min_stock, 10);

    await app.request('POST', `/products/${item.id}/archive`, { token: admin });
    assert.equal((await activeNotifications(item.id)).length, 0);
    await app.request('POST', `/products/${item.id}/restore`, { token: admin });
    assert.equal((await activeNotifications(item.id)).length, 1);

    const list = await app.request('GET', '/notifications?status=all&limit=200', { token: operator });
    const own = list.body.items.filter((entry) => entry.product.id === item.id);
    assert.equal(own.filter((entry) => entry.status === 'active').length, 1);
    assert.ok(own.some((entry) => entry.status === 'resolved'));
    const summary = await app.request('GET', '/notifications/summary', { token: operator });
    assert.ok(summary.body.active >= 1);
  });

  it('rolls back notifications together with a failed movement', async () => {
    const item = await createProduct({ minStock: 1 });
    const other = await createProduct({ minStock: 1 });
    await receipt([{ productId: item.id, quantity: 5 }]);
    assert.equal((await activeNotifications(item.id)).length, 0);

    const failed = await shipment([
      { productId: item.id, quantity: 4 },
      { productId: other.id, quantity: 1 },
    ]);
    assert.equal(failed.status, 409);
    assert.equal((await activeNotifications(item.id)).length, 0);
    assert.equal((await stock(item.id)).quantity, 5);
  });

  it('keeps posted movements immutable in the database', async () => {
    const [row] = await app.dataSource.query('SELECT id FROM stock_movements LIMIT 1');
    await assert.rejects(() => app.dataSource.query('UPDATE stock_movements SET reason = $1 WHERE id = $2', ['x', row.id]));
    await assert.rejects(() => app.dataSource.query('DELETE FROM stock_movement_lines WHERE movement_id = $1', [row.id]));
  });

  it('filters movements by type, product and UTC day', async () => {
    const item = await createProduct();
    const posted = await receipt([{ productId: item.id, quantity: 2 }]);
    const byProduct = await app.request('GET', `/movements?productId=${item.id}`, { token: operator });
    assert.equal(byProduct.body.total, 1);
    assert.equal(byProduct.body.items[0].number, posted.body.number);
    assert.equal((await app.request('GET', '/movements?type=shipment&productId=' + item.id, { token: operator })).body.total, 0);

    const insert = (number, postedAt) =>
      app.dataSource.query(
        `INSERT INTO stock_movements (number, type, posted_at, supplier_id, supplier_name, created_by_id, created_by_name)
         VALUES ($1, 'receipt', $2, 1, 'Northwind Traders', 1, 'admin')`,
        [number, postedAt],
      );
    await insert('RN-900001', '2026-03-01T23:59:59Z');
    await insert('RN-900002', '2026-03-02T00:00:00Z');
    const day = await app.request('GET', '/movements?dateFrom=2026-03-01&dateTo=2026-03-01&search=RN-9', { token: operator });
    assert.deepEqual(day.body.items.map((entry) => entry.number), ['RN-900001']);
    const two = await app.request('GET', '/movements?dateFrom=2026-03-01&dateTo=2026-03-02&search=RN-9', { token: operator });
    assert.equal(two.body.total, 2);
    assert.equal((await app.request('GET', '/movements?dateFrom=2026-02-31', { token: operator })).status, 400);
    assert.equal((await app.request('GET', '/movements?dateFrom=2026-03-05&dateTo=2026-03-01', { token: operator })).status, 400);
    assert.equal((await app.request('GET', '/movements/99999999', { token: operator })).status, 404);
    assert.equal((await app.request('GET', '/movements')).status, 401);
  });

  it('seeds inventory through movements without duplicates', async () => {
    const consistent = async () => {
      const rows = await app.dataSource.query(
        `SELECT p.sku FROM products p
         LEFT JOIN (SELECT product_id, sum(quantity_delta) AS q, sum(value_delta) AS v
                    FROM stock_movement_lines GROUP BY product_id) l ON l.product_id = p.id
         WHERE p.sku IN ('BOLT-M8-40','NUT-M8','TIE-300-100','GLOVE-L','OIL-SUN-1L','BUCK-1KG')
           AND (p.quantity <> COALESCE(l.q, 0) OR p.inventory_value <> COALESCE(l.v, 0))`,
      );
      return rows.length;
    };
    assert.equal(await consistent(), 0);
    const [seeded] = await app.dataSource.query("SELECT count(*)::int AS total FROM stock_movements WHERE number NOT LIKE 'RN-9%'");
    assert.ok(seeded.total >= 8);
    const lowSeeded = await app.dataSource.query(
      `SELECT p.sku FROM notifications n JOIN products p ON p.id = n.product_id
       WHERE n.status = 'active' AND p.sku IN ('NUT-M8', 'BUCK-1KG') ORDER BY p.sku`,
    );
    assert.deepEqual(lowSeeded.map((row) => row.sku), ['BUCK-1KG', 'NUT-M8']);

    const before = await counts();
    await app.runSeeders();
    assert.deepEqual(await counts(), before);
  });
});
