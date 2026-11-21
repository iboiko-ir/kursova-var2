import { LowStockObserver } from '../../inventory/low-stock.observer';
import { MovementService } from '../../inventory/movement.service';
import { StockChangeSubject } from '../../inventory/stock-change.subject';

const RECEIPTS = [
  {
    supplierName: 'Baltic Components Ltd',
    lines: [
      { sku: 'BOLT-M8-40', quantity: 500, unitCost: '1.10' },
      { sku: 'NUT-M8', quantity: 150, unitCost: '0.40' },
    ],
  },
  {
    supplierName: 'Northwind Traders',
    lines: [
      { sku: 'TIE-300-100', quantity: 40, unitCost: '32.00' },
      { sku: 'GLOVE-L', quantity: 60, unitCost: '45.00' },
    ],
  },
  {
    supplierName: 'Green Valley Foods',
    lines: [
      { sku: 'OIL-SUN-1L', quantity: 120, unitCost: '58.50' },
      { sku: 'BUCK-1KG', quantity: 80, unitCost: '50.00' },
    ],
  },
  {
    supplierName: 'Baltic Components Ltd',
    lines: [{ sku: 'BOLT-M8-40', quantity: 100, unitCost: '1.30' }],
  },
];

const SHIPMENTS = [
  {
    counterpartyName: 'Riverside Retail',
    lines: [
      { sku: 'OIL-SUN-1L', quantity: 30 },
      { sku: 'BUCK-1KG', quantity: 55 },
    ],
  },
  {
    counterpartyName: 'City Hardware Store',
    lines: [{ sku: 'BOLT-M8-40', quantity: 200 }],
  },
];

const WRITE_OFFS = [{ reason: 'Damaged in storage', lines: [{ sku: 'GLOVE-L', quantity: 5 }] }];

export const demoInventorySeed = {
  name: 'demo-inventory',
  async run(manager) {
    const dataSource = manager.connection;
    const stockChangeSubject = new StockChangeSubject();
    stockChangeSubject.subscribe(new LowStockObserver());
    const movementService = new MovementService(dataSource, stockChangeSubject);

    const [{ total: movementCount }] = await manager.query('SELECT count(*)::int AS total FROM stock_movements');
    const [operator] = await manager.query("SELECT id, username FROM users WHERE username = 'operator'");

    if (movementCount === 0 && operator) {
      const findProductId = async (sku) =>
        (await manager.query('SELECT id FROM products WHERE sku = $1', [sku]))[0].id;
      const findPartyId = async (tableName, name) =>
        (await manager.query(`SELECT id FROM ${tableName} WHERE name = $1`, [name]))[0].id;
      const toMovementLines = (lines) =>
        Promise.all(
          lines.map(async (line) => ({
            productId: await findProductId(line.sku),
            quantity: line.quantity,
            unitCost: line.unitCost,
          })),
        );

      for (const receipt of RECEIPTS) {
        await movementService.post(
          {
            type: 'receipt',
            supplierId: await findPartyId('suppliers', receipt.supplierName),
            lines: await toMovementLines(receipt.lines),
          },
          operator,
        );
      }
      for (const shipment of SHIPMENTS) {
        await movementService.post(
          {
            type: 'shipment',
            counterpartyId: await findPartyId('counterparties', shipment.counterpartyName),
            lines: await toMovementLines(shipment.lines),
          },
          operator,
        );
      }
      for (const writeOff of WRITE_OFFS) {
        await movementService.post(
          { type: 'write_off', reason: writeOff.reason, lines: await toMovementLines(writeOff.lines) },
          operator,
        );
      }
    }

    const products = await manager.query('SELECT id FROM products ORDER BY id');
    for (const product of products) {
      await dataSource.transaction((transactionManager) =>
        stockChangeSubject.notify({ manager: transactionManager }, product.id),
      );
    }
  },
};
