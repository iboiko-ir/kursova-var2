import { DataSource } from 'typeorm';
import { databaseOptions } from '../config/database';

export function createDataSource() {
  return new DataSource(databaseOptions());
}
