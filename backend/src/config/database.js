import { migrations } from '../database/migrations';

export function databaseOptions() {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || 'kursova',
    password: process.env.DB_PASSWORD || 'kursova_demo_password',
    database: process.env.DB_NAME || 'kursova',
    entities: [],
    migrations,
    migrationsTableName: 'migrations',
    synchronize: false,
  };
}
