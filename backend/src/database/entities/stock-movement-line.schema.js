import { EntitySchema } from 'typeorm';

export const StockMovementLineSchema = new EntitySchema({
  name: 'StockMovementLine',
  tableName: 'stock_movement_lines',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    movementId: { name: 'movement_id', type: 'int' },
    productId: { name: 'product_id', type: 'int' },
    productName: { name: 'product_name', type: 'varchar', length: 150 },
    sku: { type: 'varchar', length: 50 },
    quantity: { type: 'int' },
    unitCost: { name: 'unit_cost', type: 'numeric', precision: 18, scale: 4 },
    quantityDelta: { name: 'quantity_delta', type: 'int' },
    valueDelta: { name: 'value_delta', type: 'numeric', precision: 18, scale: 4 },
  },
  relations: {
    movement: {
      type: 'many-to-one',
      target: 'StockMovement',
      joinColumn: { name: 'movement_id' },
      nullable: false,
      inverseSide: 'lines',
    },
  },
});
