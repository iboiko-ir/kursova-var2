const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { startApp } = require('./helpers');

describe('access and catalogs', () => {
  let app;
  let admin;
  let operator;

  before(async () => {
    app = await startApp();
    admin = await app.login('admin', 'admin-demo-123');
    operator = await app.login('operator', 'operator-demo-123');
  });

  after(async () => {
    await app.close();
  });

  async function count(table) {
    const [row] = await app.dataSource.query(`SELECT count(*)::int AS total FROM ${table}`);
    return row.total;
  }

  it('does not duplicate demo data when seeding runs again', async () => {
    const before = [await count('users'), await count('suppliers'), await count('counterparties'), await count('products')];
    assert.deepEqual(before, [2, 3, 3, 6]);
    await app.runSeeders();
    await app.runSeeders();
    const after = [await count('users'), await count('suppliers'), await count('counterparties'), await count('products')];
    assert.deepEqual(after, before);
  });

  it('requires a valid login', async () => {
    const wrong = await app.request('POST', '/auth/login', { body: { username: 'admin', password: 'wrong' } });
    assert.equal(wrong.status, 401);
    assert.equal((await app.request('GET', '/products')).status, 401);
    assert.equal((await app.request('GET', '/products', { token: 'not-a-token' })).status, 401);
    const me = await app.request('GET', '/auth/me', { token: operator });
    assert.equal(me.body.role, 'operator');
  });

  it('keeps health public', async () => {
    assert.equal((await app.request('GET', '/health')).status, 200);
  });

  it('lets an operator read but blocks catalog changes', async () => {
    assert.equal((await app.request('GET', '/products', { token: operator })).status, 200);
    assert.equal((await app.request('GET', '/suppliers', { token: operator })).status, 200);
    assert.equal((await app.request('GET', '/counterparties', { token: operator })).status, 200);

    const supplier = { name: 'Operator Supplier' };
    const product = { name: 'Blocked', sku: 'BLOCKED', supplierId: 1, catalogPrice: '1.00', minStock: 1 };
    const attempts = [
      ['POST', '/suppliers', supplier],
      ['PATCH', '/suppliers/1', { name: 'Changed' }],
      ['POST', '/suppliers/1/archive'],
      ['POST', '/counterparties', supplier],
      ['PATCH', '/counterparties/1', { name: 'Changed' }],
      ['POST', '/counterparties/1/archive'],
      ['POST', '/products', product],
      ['PATCH', '/products/1', { minStock: 5 }],
      ['POST', '/products/1/archive'],
    ];
    for (const [method, path, body] of attempts) {
      const result = await app.request(method, path, { token: operator, body });
      assert.equal(result.status, 403, `${method} ${path}`);
    }
    assert.equal(await count('products'), 6);
  });

  it('creates products with normalized SKU, zero stock and a unique SKU', async () => {
    const created = await app.request('POST', '/products', {
      token: admin,
      body: { name: '  New item ', sku: ' new-item.1 ', supplierId: 1, catalogPrice: 12.5, minStock: 3 },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.sku, 'NEW-ITEM.1');
    assert.equal(created.body.name, 'New item');
    assert.equal(created.body.catalogPrice, '12.50');
    assert.equal(created.body.quantity, 0);

    const duplicate = await app.request('POST', '/products', {
      token: admin,
      body: { name: 'Other', sku: 'new-item.1', supplierId: 1, catalogPrice: '1', minStock: 0 },
    });
    assert.equal(duplicate.status, 409);
  });

  it('rejects invalid product input', async () => {
    const valid = { name: 'Valid', sku: 'VALID-1', supplierId: 1, catalogPrice: '1.00', minStock: 1 };
    const invalid = [
      { ...valid, minStock: -1 },
      { ...valid, minStock: 1.5 },
      { ...valid, catalogPrice: '1.234' },
      { ...valid, catalogPrice: '-5' },
      { ...valid, sku: 'bad sku!' },
      { ...valid, name: '   ' },
      { ...valid, quantity: 10 },
      { ...valid, supplierId: 9999 },
    ];
    for (const body of invalid) {
      const result = await app.request('POST', '/products', { token: admin, body });
      assert.equal(result.status, 400, JSON.stringify(body));
    }
    assert.equal((await app.request('GET', '/products/abc', { token: admin })).status, 400);
    assert.equal((await app.request('GET', '/products/9999', { token: admin })).status, 404);
  });

  it('edits the threshold and archives and restores a product', async () => {
    const edited = await app.request('PATCH', '/products/2', { token: admin, body: { minStock: 42 } });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.minStock, 42);

    assert.equal((await app.request('POST', '/products/2/archive', { token: admin })).body.archived, true);
    const hidden = await app.request('GET', '/products?limit=200', { token: admin });
    assert.ok(!hidden.body.items.some((item) => item.id === 2));
    const shown = await app.request('GET', '/products?includeArchived=true&limit=200', { token: admin });
    assert.ok(shown.body.items.some((item) => item.id === 2));
    assert.equal((await app.request('POST', '/products/2/restore', { token: admin })).body.archived, false);
  });

  it('does not allow an archived supplier for new products', async () => {
    const supplier = await app.request('POST', '/suppliers', { token: admin, body: { name: 'Temporary Supplier' } });
    assert.equal(supplier.status, 201);
    await app.request('POST', `/suppliers/${supplier.body.id}/archive`, { token: admin });
    const result = await app.request('POST', '/products', {
      token: admin,
      body: { name: 'Item', sku: 'ARCH-1', supplierId: supplier.body.id, catalogPrice: '2', minStock: 0 },
    });
    assert.equal(result.status, 400);
  });

  it('keeps party names unique and supports search and paging', async () => {
    const duplicate = await app.request('POST', '/counterparties', { token: admin, body: { name: 'riverside retail' } });
    assert.equal(duplicate.status, 409);

    const search = await app.request('GET', '/counterparties?search=harbor', { token: operator });
    assert.equal(search.body.total, 1);
    const paged = await app.request('GET', '/products?limit=2&page=2', { token: operator });
    assert.equal(paged.body.items.length, 2);
    assert.ok(paged.body.total >= 6);
  });
});
