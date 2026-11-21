import 'reflect-metadata';
import { createDataSource } from './data-source';

async function main() {
  const dataSource = createDataSource();
  await dataSource.initialize();
  try {
    const executed = await dataSource.runMigrations({ transaction: 'each' });
    console.log(`Migrations applied: ${executed.length}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
