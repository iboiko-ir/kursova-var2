export class CreateCatalogSchema1763800000000 {
  name = 'CreateCatalogSchema1763800000000';

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(200) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    for (const table of ['suppliers', 'counterparties']) {
      await queryRunner.query(`
        CREATE TABLE ${table} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          contact_details VARCHAR(500),
          archived BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`);
      await queryRunner.query(`CREATE UNIQUE INDEX ${table}_name_key ON ${table} (lower(name))`);
    }
    await queryRunner.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        sku VARCHAR(50) NOT NULL UNIQUE,
        supplier_id INTEGER NOT NULL REFERENCES suppliers (id) ON DELETE RESTRICT,
        catalog_price NUMERIC(14, 2) NOT NULL CHECK (catalog_price >= 0),
        min_stock INTEGER NOT NULL CHECK (min_stock >= 0),
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        inventory_value NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (inventory_value >= 0),
        archived BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await queryRunner.query('CREATE INDEX products_supplier_id_idx ON products (supplier_id)');
  }

  async down(queryRunner) {
    await queryRunner.query('DROP TABLE products');
    await queryRunner.query('DROP TABLE counterparties');
    await queryRunner.query('DROP TABLE suppliers');
    await queryRunner.query('DROP TABLE users');
  }
}
