import 'reflect-metadata';
import { createDataSource } from './data-source';
import { seeders } from './seeds';

async function main() {
  const dataSource = createDataSource();
  await dataSource.initialize();
  try {
    for (const seeder of seeders) {
      await dataSource.transaction((manager) => seeder.run(manager));
      console.log(`Seeder finished: ${seeder.name}`);
    }
    console.log(`Seeders run: ${seeders.length}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
