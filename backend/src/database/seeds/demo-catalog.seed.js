const SUPPLIERS = [
  { name: 'Northwind Traders', contactDetails: 'Phone: +380 44 100 00 01; Email: orders@northwind.example' },
  { name: 'Baltic Components Ltd', contactDetails: 'Phone: +380 44 100 00 02; Email: sales@baltic.example' },
  { name: 'Green Valley Foods', contactDetails: 'Phone: +380 44 100 00 03; Email: supply@greenvalley.example' },
];

const COUNTERPARTIES = [
  { name: 'Riverside Retail', contactDetails: 'Phone: +380 32 200 00 01; Address: 12 River Street, Lviv' },
  { name: 'City Hardware Store', contactDetails: 'Phone: +380 32 200 00 02; Address: 5 Market Square, Lviv' },
  { name: 'Harbor Logistics', contactDetails: 'Phone: +380 48 200 00 03; Address: 1 Port Avenue, Odesa' },
];

const PRODUCTS = [
  { name: 'Steel bolt M8 x 40', sku: 'BOLT-M8-40', supplierName: 'Baltic Components Ltd', catalogPrice: '1.20', minStock: 200 },
  { name: 'Steel nut M8', sku: 'NUT-M8', supplierName: 'Baltic Components Ltd', catalogPrice: '0.45', minStock: 300 },
  { name: 'Cable tie 300 mm (100 pcs)', sku: 'TIE-300-100', supplierName: 'Northwind Traders', catalogPrice: '35.00', minStock: 20 },
  { name: 'Work gloves, size L', sku: 'GLOVE-L', supplierName: 'Northwind Traders', catalogPrice: '48.50', minStock: 30 },
  { name: 'Sunflower oil 1 L', sku: 'OIL-SUN-1L', supplierName: 'Green Valley Foods', catalogPrice: '62.90', minStock: 50 },
  { name: 'Buckwheat 1 kg', sku: 'BUCK-1KG', supplierName: 'Green Valley Foods', catalogPrice: '54.00', minStock: 40 },
];

export const demoCatalogSeed = {
  name: 'demo-catalog',
  async run(manager) {
    for (const supplier of SUPPLIERS) {
      await manager.query(
        'INSERT INTO suppliers (name, contact_details) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [supplier.name, supplier.contactDetails],
      );
    }
    for (const counterparty of COUNTERPARTIES) {
      await manager.query(
        'INSERT INTO counterparties (name, contact_details) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [counterparty.name, counterparty.contactDetails],
      );
    }
    for (const product of PRODUCTS) {
      await manager.query(
        `INSERT INTO products (name, sku, supplier_id, catalog_price, min_stock)
         SELECT $1, $2, id, $4, $5 FROM suppliers WHERE name = $3
         ON CONFLICT (sku) DO NOTHING`,
        [product.name, product.sku, product.supplierName, product.catalogPrice, product.minStock],
      );
    }
  },
};
