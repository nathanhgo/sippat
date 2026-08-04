import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma dedicado ao banco de TESTES (TEST_DATABASE_URL),
 * usado pelos testes de integração/E2E para nunca tocar o banco de desenvolvimento.
 */
export function createTestPrismaClient(): PrismaClient {
  const datasourceUrl = process.env.TEST_DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error(
      'TEST_DATABASE_URL não definida. Configure o arquivo .env do backend.',
    );
  }

  return new PrismaClient({ datasourceUrl });
}
