import { EntitySchema } from 'typeorm';

export const StockMovementSchema = new EntitySchema({
  name: 'StockMovement',
  tableName: 'stock_movements',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    number: { type: 'varchar', length: 20, unique: true },
    type: { type: 'varchar', length: 20 },
    postedAt: { name: 'posted_at', type: 'timestamptz' },
    supplierId: { name: 'supplier_id', type: 'int', nullable: true },
    supplierName: { name: 'supplier_name', type: 'varchar', length: 120, nullable: true },
    supplierDetails: { name: 'supplier_details', type: 'varchar', length: 500, nullable: true },
    counterpartyId: { name: 'counterparty_id', type: 'int', nullable: true },
    counterpartyName: { name: 'counterparty_name', type: 'varchar', length: 120, nullable: true },
    counterpartyDetails: { name: 'counterparty_details', type: 'varchar', length: 500, nullable: true },
    reason: { type: 'varchar', length: 500, nullable: true },
    createdById: { name: 'created_by_id', type: 'int' },
    createdByName: { name: 'created_by_name', type: 'varchar', length: 50 },
  },
  relations: {
    lines: {
      type: 'one-to-many',
      target: 'StockMovementLine',
      inverseSide: 'movement',
    },
  },
});
