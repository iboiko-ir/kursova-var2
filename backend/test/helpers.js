const { randomBytes } = require('node:crypto');
const { Client } = require('pg');

const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'kursova',
  password: process.env.DB_PASSWORD || 'kursova_demo_password',
};

// This starts the real app on a new temporary database.
async function startApp() {
  const dbName = `kursova_test_${randomBytes(6).toString('hex')}`;
  const admin = new Client({ ...connection, database: 'postgres' });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();
  process.env.DB_NAME = dbName;

  require('reflect-metadata');
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');
  const { configureApp } = require('../dist/configure-app');
  const { createDataSource } = require('../dist/database/data-source');
  const { runSeeders } = require('../dist/database/seeds/run');

  const dataSource = createDataSource();
  await dataSource.initialize();
  await dataSource.runMigrations();
  await runSeeders(dataSource);

  const app = configureApp(await NestFactory.create(AppModule, { logger: false }));
  await app.listen(0, '127.0.0.1');
  const baseUrl = `${await app.getUrl()}/api`;

  async function close() {
    await app.close();
    await dataSource.destroy();
    const cleanup = new Client({ ...connection, database: 'postgres' });
    await cleanup.connect();
    await cleanup.query(`DROP DATABASE "${dbName}" WITH (FORCE)`);
    await cleanup.end();
  }

  async function request(method, path, { token, body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  async function login(username, password) {
    const result = await request('POST', '/auth/login', { body: { username, password } });
    return result.body && result.body.accessToken;
  }

  return { request, login, dataSource, runSeeders: () => runSeeders(dataSource), close };
}

module.exports = { startApp };
