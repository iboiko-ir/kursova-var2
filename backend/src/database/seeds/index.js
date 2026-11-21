import { demoCatalogSeed } from './demo-catalog.seed';
import { demoUsersSeed } from './demo-users.seed';

// A seeder is an object: { name, run(manager) }. Each seeder must be idempotent.
export const seeders = [demoUsersSeed, demoCatalogSeed];
