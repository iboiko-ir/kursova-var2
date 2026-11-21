import 'reflect-metadata';
import { createDataSource } from './data-source';
import { runSeeders } from './seeds/run';

async function main() {
  const dataSource = createDataSource();
  await dataSource.initialize();
  try {
    const count = await runSeeders(dataSource);
    console.log(`Seeders run: ${count}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
