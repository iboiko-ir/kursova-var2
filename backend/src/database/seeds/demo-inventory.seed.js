import { LowStockObserver } from '../../inventory/low-stock.observer';
import { MovementService } from '../../inventory/movement.service';
import { StockChangeSubject } from '../../inventory/stock-change.subject';

const RECEIPTS = [
  ['Baltic Components Ltd', [['BOLT-M8-40', 500, '1.10'], ['NUT-M8', 150, '0.40']]],
  ['Northwind Traders', [['TIE-300-100', 40, '32.00'], ['GLOVE-L', 60, '45.00']]],
  ['Green Valley Foods', [['OIL-SUN-1L', 120, '58.50'], ['BUCK-1KG', 80, '50.00']]],
  ['Baltic Components Ltd', [['BOLT-M8-40', 100, '1.30']]],
];

const SHIPMENTS = [
  ['Riverside Retail', [['OIL-SUN-1L', 30], ['BUCK-1KG', 55]]],
  ['City Hardware Store', [['BOLT-M8-40', 200]]],
];

const WRITE_OFFS = [['Damaged in storage', [['GLOVE-L', 5]]]];

export const demoInventorySeed = {
  name: 'demo-inventory',
  async run(manager) {
    const dataSource = manager.connection;
    const subject = new StockChangeSubject();
    subject.subscribe(new LowStockObserver());
    const movements = new MovementService(dataSource, subject);

    const [{ total }] = await manager.query('SELECT count(*)::int AS total FROM stock_movements');
    const [user] = await manager.query("SELECT id, username FROM users WHERE username = 'operator'");
    if (total === 0 && user) {
      const productId = async (sku) => (await manager.query('SELECT id FROM products WHERE sku = $1', [sku]))[0].id;
      const partyId = async (table, name) => (await manager.query(`SELECT id FROM ${table} WHERE name = $1`, [name]))[0].id;
      const lines = (items) =>
        Promise.all(
          items.map(async ([sku, quantity, unitCost]) => ({ productId: await productId(sku), quantity, unitCost })),
        );

      for (const [supplier, items] of RECEIPTS) {
        await movements.post(
          { type: 'receipt', supplierId: await partyId('suppliers', supplier), lines: await lines(items) },
          user,
        );
      }
      for (const [counterparty, items] of SHIPMENTS) {
        await movements.post(
          { type: 'shipment', counterpartyId: await partyId('counterparties', counterparty), lines: await lines(items) },
          user,
        );
      }
      for (const [reason, items] of WRITE_OFFS) {
        await movements.post({ type: 'write_off', reason, lines: await lines(items) }, user);
      }
    }

    const products = await manager.query('SELECT id FROM products ORDER BY id');
    for (const { id } of products) {
      await dataSource.transaction((inner) => subject.notify({ manager: inner }, id));
    }
  },
};
