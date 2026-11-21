export class CreateInventorySchema1763900000000 {
  name = 'CreateInventorySchema1763900000000';

  async up(queryRunner) {
    await queryRunner.query('CREATE SEQUENCE movement_receipt_seq START 1');
    await queryRunner.query('CREATE SEQUENCE movement_shipment_seq START 1');
    await queryRunner.query('CREATE SEQUENCE movement_write_off_seq START 1');

    await queryRunner.query(`
      CREATE TABLE stock_movements (
        id SERIAL PRIMARY KEY,
        number VARCHAR(20) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'shipment', 'write_off')),
        posted_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
        supplier_id INTEGER REFERENCES suppliers (id) ON DELETE RESTRICT,
        supplier_name VARCHAR(120),
        supplier_details VARCHAR(500),
        counterparty_id INTEGER REFERENCES counterparties (id) ON DELETE RESTRICT,
        counterparty_name VARCHAR(120),
        counterparty_details VARCHAR(500),
        reason VARCHAR(500),
        created_by_id INTEGER NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
        created_by_name VARCHAR(50) NOT NULL,
        CONSTRAINT stock_movements_party_rules CHECK (
          (type = 'receipt' AND supplier_id IS NOT NULL AND counterparty_id IS NULL AND reason IS NULL)
          OR (type = 'shipment' AND counterparty_id IS NOT NULL AND supplier_id IS NULL AND reason IS NULL)
          OR (type = 'write_off' AND length(trim(reason)) > 0 AND supplier_id IS NULL AND counterparty_id IS NULL)
        )
      )`);
    await queryRunner.query('CREATE INDEX stock_movements_posted_at_idx ON stock_movements (posted_at, id)');

    await queryRunner.query(`
      CREATE TABLE stock_movement_lines (
        id SERIAL PRIMARY KEY,
        movement_id INTEGER NOT NULL REFERENCES stock_movements (id) ON DELETE RESTRICT,
        product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
        product_name VARCHAR(150) NOT NULL,
        sku VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_cost NUMERIC(18, 4) NOT NULL CHECK (unit_cost >= 0),
        quantity_delta INTEGER NOT NULL,
        value_delta NUMERIC(18, 4) NOT NULL,
        CONSTRAINT stock_movement_lines_unique_product UNIQUE (movement_id, product_id),
        CONSTRAINT stock_movement_lines_delta_matches CHECK (quantity_delta = quantity OR quantity_delta = -quantity)
      )`);
    await queryRunner.query('CREATE INDEX stock_movement_lines_product_idx ON stock_movement_lines (product_id)');

    await queryRunner.query(`
      CREATE FUNCTION forbid_posted_movement_change() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Posted stock movements cannot be changed or deleted';
      END;
      $$ LANGUAGE plpgsql`);
    for (const table of ['stock_movements', 'stock_movement_lines']) {
      await queryRunner.query(`
        CREATE TRIGGER ${table}_immutable BEFORE UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION forbid_posted_movement_change()`);
    }

    await queryRunner.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
        type VARCHAR(20) NOT NULL DEFAULT 'low_stock' CHECK (type = 'low_stock'),
        status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'resolved')),
        quantity INTEGER NOT NULL,
        min_stock INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ
      )`);
    await queryRunner.query(
      "CREATE UNIQUE INDEX notifications_one_active_per_product ON notifications (product_id) WHERE status = 'active'",
    );
  }

  async down(queryRunner) {
    await queryRunner.query('DROP TABLE notifications');
    await queryRunner.query('DROP TABLE stock_movement_lines');
    await queryRunner.query('DROP TABLE stock_movements');
    await queryRunner.query('DROP FUNCTION forbid_posted_movement_change()');
    await queryRunner.query('DROP SEQUENCE movement_write_off_seq');
    await queryRunner.query('DROP SEQUENCE movement_shipment_seq');
    await queryRunner.query('DROP SEQUENCE movement_receipt_seq');
  }
}
