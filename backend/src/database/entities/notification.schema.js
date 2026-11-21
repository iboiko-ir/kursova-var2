import { EntitySchema } from 'typeorm';

export const NotificationSchema = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    productId: { name: 'product_id', type: 'int' },
    type: { type: 'varchar', length: 20, default: 'low_stock' },
    status: { type: 'varchar', length: 20 },
    quantity: { type: 'int' },
    minStock: { name: 'min_stock', type: 'int' },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    resolvedAt: { name: 'resolved_at', type: 'timestamptz', nullable: true },
  },
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
      joinColumn: { name: 'product_id' },
      nullable: false,
    },
  },
});
