import { EntitySchema } from 'typeorm';

export const CounterpartySchema = new EntitySchema({
  name: 'Counterparty',
  tableName: 'counterparties',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    name: { type: 'varchar', length: 120 },
    contactDetails: { name: 'contact_details', type: 'varchar', length: 500, nullable: true },
    archived: { type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
  },
});
