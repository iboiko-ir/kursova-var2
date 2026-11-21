const SUPPLIERS = [
  ['Northwind Traders', 'Phone: +380 44 100 00 01; Email: orders@northwind.example'],
  ['Baltic Components Ltd', 'Phone: +380 44 100 00 02; Email: sales@baltic.example'],
  ['Green Valley Foods', 'Phone: +380 44 100 00 03; Email: supply@greenvalley.example'],
];

const COUNTERPARTIES = [
  ['Riverside Retail', 'Phone: +380 32 200 00 01; Address: 12 River Street, Lviv'],
  ['City Hardware Store', 'Phone: +380 32 200 00 02; Address: 5 Market Square, Lviv'],
  ['Harbor Logistics', 'Phone: +380 48 200 00 03; Address: 1 Port Avenue, Odesa'],
];

// name, SKU, supplier name, catalog price, minimum stock
const PRODUCTS = [
  ['Steel bolt M8 x 40', 'BOLT-M8-40', 'Baltic Components Ltd', '1.20', 200],
  ['Steel nut M8', 'NUT-M8', 'Baltic Components Ltd', '0.45', 300],
  ['Cable tie 300 mm (100 pcs)', 'TIE-300-100', 'Northwind Traders', '35.00', 20],
  ['Work gloves, size L', 'GLOVE-L', 'Northwind Traders', '48.50', 30],
  ['Sunflower oil 1 L', 'OIL-SUN-1L', 'Green Valley Foods', '62.90', 50],
  ['Buckwheat 1 kg', 'BUCK-1KG', 'Green Valley Foods', '54.00', 40],
];

// Demo products start with zero stock. Stock is added only by goods receipts.
export const demoCatalogSeed = {
  name: 'demo-catalog',
  async run(manager) {
    for (const [name, details] of SUPPLIERS) {
      await manager.query(
        'INSERT INTO suppliers (name, contact_details) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [name, details],
      );
    }
    for (const [name, details] of COUNTERPARTIES) {
      await manager.query(
        'INSERT INTO counterparties (name, contact_details) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [name, details],
      );
    }
    for (const [name, sku, supplierName, price, minStock] of PRODUCTS) {
      await manager.query(
        `INSERT INTO products (name, sku, supplier_id, catalog_price, min_stock)
         SELECT $1, $2, id, $4, $5 FROM suppliers WHERE name = $3
         ON CONFLICT (sku) DO NOTHING`,
        [name, sku, supplierName, price, minStock],
      );
    }
  },
};
