import { EntitySchema } from 'typeorm';

export const UserSchema = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    username: { type: 'varchar', length: 50, unique: true },
    passwordHash: { name: 'password_hash', type: 'varchar', length: 200 },
    role: { type: 'varchar', length: 20 },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
  },
});
