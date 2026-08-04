// Aplica as migrations do Prisma no banco de TESTES (TEST_DATABASE_URL),
// sem precisar de um segundo prisma.config.ts. Usado pelo script "prisma:migrate:test"
// e pela task "DB: Migrate (Testes)".
require('dotenv/config');
const { spawnSync } = require('node:child_process');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  console.error('TEST_DATABASE_URL não definida no .env');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
