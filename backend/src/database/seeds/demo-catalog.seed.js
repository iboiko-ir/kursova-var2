const SUPPLIERS = [
  { name: 'Chumak', contactDetails: 'Phone: +380 44 500 10 01; Email: orders@chumak.example; Kyiv' },
  { name: 'Torchyn Products', contactDetails: 'Phone: +380 44 500 10 02; Email: sales@torchyn.example; Kyiv' },
  { name: 'Oleina', contactDetails: 'Phone: +380 56 500 10 03; Email: orders@oleina.example; Dnipro' },
  { name: 'Morshynska', contactDetails: 'Phone: +380 3260 5 10 04; Email: sales@morshynska.example; Morshyn' },
  { name: 'Karpatska Dzherelna', contactDetails: 'Phone: +380 3434 5 10 05; Email: orders@karpatska.example; Ivano-Frankivsk' },
  { name: 'Artemsil', contactDetails: 'Phone: +380 6274 5 10 06; Email: sales@artemsil.example; Soledar' },
  { name: 'Roshen', contactDetails: 'Phone: +380 44 500 10 07; Email: orders@roshen.example; Kyiv' },
  { name: 'Yagotynske', contactDetails: 'Phone: +380 4575 5 10 08; Email: sales@yagotynske.example; Yahotyn' },
  { name: 'Kolos Grain', contactDetails: 'Phone: +380 32 500 10 09; Email: orders@kolos.example; Lviv' },
];

const COUNTERPARTIES = [
  { name: 'Central Store Kyiv', contactDetails: 'Phone: +380 44 600 20 01; Address: 15 Khreshchatyk Street, Kyiv' },
  { name: 'Rynok Store Lviv', contactDetails: 'Phone: +380 32 600 20 02; Address: 8 Rynok Square, Lviv' },
  { name: 'Smachno Cafe', contactDetails: 'Phone: +380 44 600 20 03; Address: 21 Saksahanskoho Street, Kyiv' },
  { name: 'School Canteen No. 5', contactDetails: 'Phone: +380 32 600 20 04; Address: 3 Shkilna Street, Lviv' },
  { name: 'Karpaty Hotel Restaurant', contactDetails: 'Phone: +380 3434 6 20 05; Address: 1 Hirska Street, Bukovel' },
  { name: 'Dnipro Corner Shop', contactDetails: 'Phone: +380 56 600 20 06; Address: 40 Yavornytskoho Avenue, Dnipro' },
];

const PRODUCTS = [
  { name: 'Chumak Tomato Paste 70 g', sku: 'CHM-TP-70', supplierName: 'Chumak', catalogPrice: '18.50', minStock: 60 },
  { name: 'Chumak Tomato Paste 140 g', sku: 'CHM-TP-140', supplierName: 'Chumak', catalogPrice: '32.00', minStock: 50 },
  { name: 'Chumak Ketchup Mild 450 g', sku: 'CHM-KT-450', supplierName: 'Chumak', catalogPrice: '49.90', minStock: 40 },
  { name: 'Chumak Green Peas 400 g', sku: 'CHM-PEAS-400', supplierName: 'Chumak', catalogPrice: '38.50', minStock: 40 },
  { name: 'Chumak Sweet Corn 340 g', sku: 'CHM-CORN-340', supplierName: 'Chumak', catalogPrice: '41.00', minStock: 40 },
  { name: 'Chumak Pasta Sauce Basil 350 g', sku: 'CHM-SAUCE-350', supplierName: 'Chumak', catalogPrice: '54.00', minStock: 30 },

  { name: 'Torchyn Mayonnaise Provencal 380 g', sku: 'TRC-MAY-380', supplierName: 'Torchyn Products', catalogPrice: '42.00', minStock: 50 },
  { name: 'Torchyn Mayonnaise Provencal 550 g', sku: 'TRC-MAY-550', supplierName: 'Torchyn Products', catalogPrice: '61.50', minStock: 40 },
  { name: 'Torchyn Ketchup Tomato 270 g', sku: 'TRC-KT-270', supplierName: 'Torchyn Products', catalogPrice: '34.00', minStock: 40 },
  { name: 'Torchyn Mustard Hot 130 g', sku: 'TRC-MUS-130', supplierName: 'Torchyn Products', catalogPrice: '24.50', minStock: 30 },
  { name: 'Torchyn Horseradish 100 g', sku: 'TRC-HRS-100', supplierName: 'Torchyn Products', catalogPrice: '22.00', minStock: 25 },

  { name: 'Oleina Refined Sunflower Oil 0.85 L', sku: 'OLE-SUN-850', supplierName: 'Oleina', catalogPrice: '76.00', minStock: 60 },
  { name: 'Oleina Refined Sunflower Oil 1 L', sku: 'OLE-SUN-1000', supplierName: 'Oleina', catalogPrice: '86.50', minStock: 50 },
  { name: 'Oleina Unrefined Sunflower Oil 0.85 L', sku: 'OLE-UNR-850', supplierName: 'Oleina', catalogPrice: '79.00', minStock: 30 },
  { name: 'Oleina Sunflower and Olive Oil Mix 0.5 L', sku: 'OLE-MIX-500', supplierName: 'Oleina', catalogPrice: '69.00', minStock: 20 },

  { name: 'Morshynska Still Water 0.5 L', sku: 'MOR-STILL-05', supplierName: 'Morshynska', catalogPrice: '15.00', minStock: 120 },
  { name: 'Morshynska Still Water 1.5 L', sku: 'MOR-STILL-15', supplierName: 'Morshynska', catalogPrice: '24.00', minStock: 100 },
  { name: 'Morshynska Sparkling Water 1.5 L', sku: 'MOR-SPARK-15', supplierName: 'Morshynska', catalogPrice: '24.00', minStock: 100 },
  { name: 'Morshynska Still Water 6 L', sku: 'MOR-STILL-6', supplierName: 'Morshynska', catalogPrice: '52.00', minStock: 30 },

  { name: 'Karpatska Dzherelna Still Water 1.5 L', sku: 'KRP-STILL-15', supplierName: 'Karpatska Dzherelna', catalogPrice: '21.50', minStock: 100 },
  { name: 'Karpatska Dzherelna Sparkling Water 0.5 L', sku: 'KRP-SPARK-05', supplierName: 'Karpatska Dzherelna', catalogPrice: '14.50', minStock: 100 },
  { name: 'Karpatska Dzherelna Still Water 5 L', sku: 'KRP-STILL-5', supplierName: 'Karpatska Dzherelna', catalogPrice: '39.00', minStock: 30 },

  { name: 'Artemsil Table Salt 1 kg', sku: 'ART-SALT-1', supplierName: 'Artemsil', catalogPrice: '14.50', minStock: 80 },
  { name: 'Artemsil Iodized Salt 1 kg', sku: 'ART-SALT-I-1', supplierName: 'Artemsil', catalogPrice: '16.50', minStock: 60 },
  { name: 'Artemsil Sea Salt 500 g', sku: 'ART-SEA-500', supplierName: 'Artemsil', catalogPrice: '29.00', minStock: 20 },

  { name: 'Roshen Milk Chocolate Bar 90 g', sku: 'ROS-CHOC-90', supplierName: 'Roshen', catalogPrice: '39.00', minStock: 60 },
  { name: 'Roshen Korivka Candies 200 g', sku: 'ROS-KOR-200', supplierName: 'Roshen', catalogPrice: '58.00', minStock: 40 },
  { name: 'Roshen Hazelnut Wafers 216 g', sku: 'ROS-WAF-216', supplierName: 'Roshen', catalogPrice: '52.00', minStock: 30 },

  { name: 'Yagotynske Milk 2.6% 0.9 L', sku: 'YAG-MILK-900', supplierName: 'Yagotynske', catalogPrice: '38.50', minStock: 80 },
  { name: 'Yagotynske Butter 82% 180 g', sku: 'YAG-BUT-180', supplierName: 'Yagotynske', catalogPrice: '98.00', minStock: 40 },
  { name: 'Yagotynske Sour Cream 20% 350 g', sku: 'YAG-SC-350', supplierName: 'Yagotynske', catalogPrice: '52.00', minStock: 40 },
  { name: 'Yagotynske Cottage Cheese 5% 200 g', sku: 'YAG-CHE-200', supplierName: 'Yagotynske', catalogPrice: '44.00', minStock: 30 },

  { name: 'Buckwheat 800 g', sku: 'KOL-BWH-800', supplierName: 'Kolos Grain', catalogPrice: '62.00', minStock: 60 },
  { name: 'Long Grain Rice 800 g', sku: 'KOL-RICE-800', supplierName: 'Kolos Grain', catalogPrice: '55.00', minStock: 50 },
  { name: 'Rolled Oats 500 g', sku: 'KOL-OAT-500', supplierName: 'Kolos Grain', catalogPrice: '34.00', minStock: 40 },
  { name: 'White Sugar 1 kg', sku: 'KOL-SUG-1', supplierName: 'Kolos Grain', catalogPrice: '36.00', minStock: 80 },
  { name: 'Wheat Flour 2 kg', sku: 'KOL-FLR-2', supplierName: 'Kolos Grain', catalogPrice: '52.00', minStock: 50 },
  { name: 'Spaghetti 400 g', sku: 'KOL-PAS-400', supplierName: 'Kolos Grain', catalogPrice: '31.00', minStock: 50 },
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
