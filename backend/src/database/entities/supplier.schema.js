import { EntitySchema } from 'typeorm';

export const SupplierSchema = new EntitySchema({
  name: 'Supplier',
  tableName: 'suppliers',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    name: { type: 'varchar', length: 120 },
    contactDetails: { name: 'contact_details', type: 'varchar', length: 500, nullable: true },
    archived: { type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
});
