import { seeders } from './index';

export async function runSeeders(dataSource) {
  for (const seeder of seeders) {
    await dataSource.transaction((manager) => seeder.run(manager));
    console.log(`Seeder finished: ${seeder.name}`);
  }
  return seeders.length;
}
