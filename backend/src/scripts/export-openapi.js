import { writeFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:3000/api/openapi.json';
const file = process.argv[3] || 'openapi.json';

async function main() {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const document = await response.json();
  await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`OpenAPI document saved to ${file}`);
}

main().catch((error) => {
  console.error('Export failed:', error.message);
  process.exit(1);
});
