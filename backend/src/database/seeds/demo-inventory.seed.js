import { LowStockObserver } from '../../inventory/low-stock.observer';
import { MovementService } from '../../inventory/movement.service';
import { StockChangeSubject } from '../../inventory/stock-change.subject';

const RECEIPTS = [
  {
    supplierName: 'Chumak',
    lines: [
      { sku: 'CHM-TP-70', quantity: 200, unitCost: '14.20' },
      { sku: 'CHM-TP-140', quantity: 120, unitCost: '24.80' },
      { sku: 'CHM-KT-450', quantity: 90, unitCost: '38.40' },
      { sku: 'CHM-PEAS-400', quantity: 100, unitCost: '29.50' },
      { sku: 'CHM-CORN-340', quantity: 100, unitCost: '31.60' },
      { sku: 'CHM-SAUCE-350', quantity: 60, unitCost: '41.50' },
    ],
  },
  {
    supplierName: 'Torchyn Products',
    lines: [
      { sku: 'TRC-MAY-380', quantity: 150, unitCost: '32.50' },
      { sku: 'TRC-MAY-550', quantity: 100, unitCost: '47.00' },
      { sku: 'TRC-KT-270', quantity: 120, unitCost: '26.00' },
      { sku: 'TRC-MUS-130', quantity: 70, unitCost: '18.80' },
      { sku: 'TRC-HRS-100', quantity: 20, unitCost: '17.00' },
    ],
  },
  {
    supplierName: 'Oleina',
    lines: [
      { sku: 'OLE-SUN-850', quantity: 180, unitCost: '58.50' },
      { sku: 'OLE-SUN-1000', quantity: 140, unitCost: '66.50' },
      { sku: 'OLE-UNR-850', quantity: 70, unitCost: '60.80' },
      { sku: 'OLE-MIX-500', quantity: 40, unitCost: '53.00' },
    ],
  },
  {
    supplierName: 'Morshynska',
    lines: [
      { sku: 'MOR-STILL-05', quantity: 300, unitCost: '11.40' },
      { sku: 'MOR-STILL-15', quantity: 250, unitCost: '18.30' },
      { sku: 'MOR-SPARK-15', quantity: 250, unitCost: '18.30' },
      { sku: 'MOR-STILL-6', quantity: 25, unitCost: '40.00' },
    ],
  },
  {
    supplierName: 'Karpatska Dzherelna',
    lines: [
      { sku: 'KRP-STILL-15', quantity: 220, unitCost: '16.40' },
      { sku: 'KRP-SPARK-05', quantity: 260, unitCost: '11.00' },
      { sku: 'KRP-STILL-5', quantity: 80, unitCost: '30.00' },
    ],
  },
  {
    supplierName: 'Artemsil',
    lines: [
      { sku: 'ART-SALT-1', quantity: 200, unitCost: '11.00' },
      { sku: 'ART-SALT-I-1', quantity: 150, unitCost: '12.60' },
      { sku: 'ART-SEA-500', quantity: 45, unitCost: '22.00' },
    ],
  },
  {
    supplierName: 'Roshen',
    lines: [
      { sku: 'ROS-CHOC-90', quantity: 160, unitCost: '30.00' },
      { sku: 'ROS-KOR-200', quantity: 90, unitCost: '44.50' },
      { sku: 'ROS-WAF-216', quantity: 28, unitCost: '40.00' },
    ],
  },
  {
    supplierName: 'Yagotynske',
    lines: [
      { sku: 'YAG-MILK-900', quantity: 220, unitCost: '29.50' },
      { sku: 'YAG-BUT-180', quantity: 100, unitCost: '76.00' },
      { sku: 'YAG-SC-350', quantity: 110, unitCost: '40.00' },
      { sku: 'YAG-CHE-200', quantity: 70, unitCost: '34.00' },
    ],
  },
  {
    supplierName: 'Kolos Grain',
    lines: [
      { sku: 'KOL-BWH-800', quantity: 150, unitCost: '47.50' },
      { sku: 'KOL-RICE-800', quantity: 130, unitCost: '42.00' },
      { sku: 'KOL-OAT-500', quantity: 100, unitCost: '26.00' },
      { sku: 'KOL-SUG-1', quantity: 220, unitCost: '27.50' },
      { sku: 'KOL-FLR-2', quantity: 120, unitCost: '40.00' },
      { sku: 'KOL-PAS-400', quantity: 110, unitCost: '23.80' },
    ],
  },
  {
    supplierName: 'Oleina',
    lines: [
      { sku: 'OLE-SUN-850', quantity: 100, unitCost: '61.00' },
    ],
  },
  {
    supplierName: 'Chumak',
    lines: [
      { sku: 'CHM-TP-70', quantity: 150, unitCost: '15.00' },
    ],
  },
  {
    supplierName: 'Morshynska',
    lines: [
      { sku: 'MOR-STILL-05', quantity: 150, unitCost: '11.90' },
    ],
  },
  {
    supplierName: 'Kolos Grain',
    lines: [
      { sku: 'KOL-SUG-1', quantity: 100, unitCost: '29.00' },
    ],
  },
];

const SHIPMENTS = [
  {
    counterpartyName: 'Central Store Kyiv',
    lines: [
      { sku: 'CHM-TP-70', quantity: 120 },
      { sku: 'TRC-MAY-380', quantity: 80 },
      { sku: 'OLE-SUN-850', quantity: 120 },
      { sku: 'MOR-STILL-05', quantity: 200 },
      { sku: 'ART-SALT-1', quantity: 90 },
      { sku: 'YAG-MILK-900', quantity: 120 },
      { sku: 'KOL-BWH-800', quantity: 70 },
    ],
  },
  {
    counterpartyName: 'Rynok Store Lviv',
    lines: [
      { sku: 'KRP-STILL-15', quantity: 150 },
      { sku: 'KRP-SPARK-05', quantity: 180 },
      { sku: 'ROS-CHOC-90', quantity: 110 },
      { sku: 'ROS-KOR-200', quantity: 55 },
      { sku: 'KOL-SUG-1', quantity: 200 },
      { sku: 'KOL-RICE-800', quantity: 90 },
    ],
  },
  {
    counterpartyName: 'Smachno Cafe',
    lines: [
      { sku: 'OLE-SUN-1000', quantity: 60 },
      { sku: 'KOL-FLR-2', quantity: 70 },
      { sku: 'YAG-BUT-180', quantity: 45 },
      { sku: 'YAG-SC-350', quantity: 60 },
      { sku: 'CHM-KT-450', quantity: 40 },
    ],
  },
  {
    counterpartyName: 'School Canteen No. 5',
    lines: [
      { sku: 'KOL-OAT-500', quantity: 60 },
      { sku: 'KOL-PAS-400', quantity: 70 },
      { sku: 'KOL-BWH-800', quantity: 40 },
      { sku: 'CHM-PEAS-400', quantity: 60 },
      { sku: 'YAG-CHE-200', quantity: 40 },
    ],
  },
  {
    counterpartyName: 'Karpaty Hotel Restaurant',
    lines: [
      { sku: 'MOR-STILL-15', quantity: 120 },
      { sku: 'MOR-SPARK-15', quantity: 140 },
      { sku: 'TRC-MAY-550', quantity: 50 },
      { sku: 'OLE-UNR-850', quantity: 20 },
    ],
  },
  {
    counterpartyName: 'Dnipro Corner Shop',
    lines: [
      { sku: 'ART-SALT-I-1', quantity: 100 },
      { sku: 'MOR-STILL-6', quantity: 10 },
      { sku: 'CHM-TP-140', quantity: 70 },
      { sku: 'TRC-KT-270', quantity: 85 },
    ],
  },
];

const WRITE_OFFS = [
  {
    reason: 'Expired shelf life',
    lines: [
      { sku: 'YAG-MILK-900', quantity: 12 },
      { sku: 'YAG-SC-350', quantity: 6 },
    ],
  },
  {
    reason: 'Damaged packaging',
    lines: [
      { sku: 'CHM-CORN-340', quantity: 4 },
      { sku: 'ROS-WAF-216', quantity: 3 },
    ],
  },
  {
    reason: 'Damaged in transport',
    lines: [
      { sku: 'MOR-STILL-05', quantity: 10 },
    ],
  },
];

export const demoInventorySeed = {
  name: 'demo-inventory',
  async run(manager) {
    const dataSource = manager.connection;
    const stockChangeSubject = new StockChangeSubject();
    stockChangeSubject.subscribe(new LowStockObserver());
    const movementService = new MovementService(dataSource, stockChangeSubject);

    // Only products without any movement get demo stock, so the seed can run again safely.
    const existingSkus = new Set((await manager.query('SELECT sku FROM products')).map((product) => product.sku));
    const skusWithHistory = new Set(
      (
        await manager.query(
          'SELECT DISTINCT product.sku FROM stock_movement_lines line JOIN products product ON product.id = line.product_id',
        )
      ).map((product) => product.sku),
    );
    const isNewDocument = (lines) =>
      lines.every((line) => existingSkus.has(line.sku) && !skusWithHistory.has(line.sku));
    const [operator] = await manager.query("SELECT id, username FROM users WHERE username = 'operator'");

    if (operator) {
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

      for (const receipt of RECEIPTS.filter((document) => isNewDocument(document.lines))) {
        await movementService.post(
          {
            type: 'receipt',
            supplierId: await findPartyId('suppliers', receipt.supplierName),
            lines: await toMovementLines(receipt.lines),
          },
          operator,
        );
      }
      for (const shipment of SHIPMENTS.filter((document) => isNewDocument(document.lines))) {
        await movementService.post(
          {
            type: 'shipment',
            counterpartyId: await findPartyId('counterparties', shipment.counterpartyName),
            lines: await toMovementLines(shipment.lines),
          },
          operator,
        );
      }
      for (const writeOff of WRITE_OFFS.filter((document) => isNewDocument(document.lines))) {
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
