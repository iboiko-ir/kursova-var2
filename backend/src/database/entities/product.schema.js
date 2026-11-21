import { EntitySchema } from 'typeorm';

export const ProductSchema = new EntitySchema({
  name: 'Product',
  tableName: 'products',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    name: { type: 'varchar', length: 150 },
    sku: { type: 'varchar', length: 50, unique: true },
    supplierId: { name: 'supplier_id', type: 'int' },
    catalogPrice: { name: 'catalog_price', type: 'numeric', precision: 14, scale: 2 },
    minStock: { name: 'min_stock', type: 'int' },
    quantity: { type: 'int', default: 0 },
    inventoryValue: { name: 'inventory_value', type: 'numeric', precision: 18, scale: 4, default: 0 },
    archived: { type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
  relations: {
    supplier: {
      type: 'many-to-one',
      target: 'Supplier',
      joinColumn: { name: 'supplier_id' },
      nullable: false,
      onDelete: 'RESTRICT',
    },
  },
});
