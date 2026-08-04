import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTestPrismaClient } from './utils/prisma-test-client';
import type { PrismaClient } from '@prisma/client';

/**
 * Testes de integração (TDD) do esquema Prisma contra o banco de TESTES real.
 * Cobrem as constraints descritas em `.docs/database_schema.md`:
 * unicidade de CPF/NIS/e-mail, campos obrigatórios (NOT NULL) e ENUMs fechados.
 *
 * Pré-requisito: `docker compose up -d` e migrations aplicadas no banco de testes
 * (`npm run prisma:migrate:test`).
 */
describe('Constraints do esquema do banco de dados (Fase 1)', () => {
  let prisma: PrismaClient;
  const citizenIds: string[] = [];
  const userIds: string[] = [];

  const randomCpf = () => String(Date.now()).slice(-11).padStart(11, '0');

  const validCitizenData = () => ({
    cpf: randomCpf(),
    fullName: 'Cidadão de Teste',
    birthDate: new Date('1990-01-01'),
    gender: 'MASCULINO' as const,
    raceColor: 'PARDA' as const,
    maritalStatus: 'SOLTEIRO' as const,
  });

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterEach(async () => {
    if (citizenIds.length) {
      await prisma.citizen.deleteMany({ where: { id: { in: citizenIds } } });
      citizenIds.length = 0;
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      userIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deve criar um cidadão com todos os campos obrigatórios válidos', async () => {
    const citizen = await prisma.citizen.create({ data: validCitizenData() });
    citizenIds.push(citizen.id);

    expect(citizen.id).toBeDefined();
    expect(citizen.gender).toBe('MASCULINO');
  });

  it('deve rejeitar CPF duplicado ao criar dois cidadãos', async () => {
    const data = validCitizenData();
    const first = await prisma.citizen.create({ data });
    citizenIds.push(first.id);

    await expect(
      prisma.citizen.create({ data: { ...data, fullName: 'Outro Cidadão' } }),
    ).rejects.toThrow();
  });

  it('deve rejeitar a criação de um cidadão sem Gênero (campo obrigatório)', async () => {
    const { gender: _gender, ...rest } = validCitizenData();
    await expect(
      prisma.citizen.create({ data: rest as never }),
    ).rejects.toThrow();
  });

  it('deve rejeitar a criação de um cidadão sem Raça/Cor (campo obrigatório)', async () => {
    const { raceColor: _raceColor, ...rest } = validCitizenData();
    await expect(
      prisma.citizen.create({ data: rest as never }),
    ).rejects.toThrow();
  });

  it('deve rejeitar a criação de um cidadão sem Estado Civil (campo obrigatório)', async () => {
    const { maritalStatus: _maritalStatus, ...rest } = validCitizenData();
    await expect(
      prisma.citizen.create({ data: rest as never }),
    ).rejects.toThrow();
  });

  it('deve rejeitar e-mail duplicado ao criar dois usuários (funcionários)', async () => {
    const email = `${randomUUID()}@sippat.jacarei.sp.gov.br`;
    const first = await prisma.user.create({
      data: {
        name: 'Atendente Um',
        email,
        passwordHash: 'hash-fake-para-teste',
        role: 'ATTENDANT',
      },
    });
    userIds.push(first.id);

    await expect(
      prisma.user.create({
        data: {
          name: 'Atendente Dois',
          email,
          passwordHash: 'outro-hash-fake',
          role: 'ATTENDANT',
        },
      }),
    ).rejects.toThrow();
  });

  it('deve rejeitar NIS duplicado entre dois perfis socioeconômicos', async () => {
    const nis = String(Date.now()).slice(-11);

    const citizenA = await prisma.citizen.create({ data: validCitizenData() });
    citizenIds.push(citizenA.id);
    const citizenB = await prisma.citizen.create({ data: validCitizenData() });
    citizenIds.push(citizenB.id);

    await prisma.socialProfile.create({
      data: { citizenId: citizenA.id, nis },
    });

    await expect(
      prisma.socialProfile.create({
        data: { citizenId: citizenB.id, nis },
      }),
    ).rejects.toThrow();
  });

  it('deve rejeitar um valor de service_type fora do ENUM permitido', async () => {
    const citizen = await prisma.citizen.create({ data: validCitizenData() });
    citizenIds.push(citizen.id);
    const user = await prisma.user.create({
      data: {
        name: 'Atendente Enum',
        email: `${randomUUID()}@sippat.jacarei.sp.gov.br`,
        passwordHash: 'hash-fake-para-teste',
        role: 'ATTENDANT',
      },
    });
    userIds.push(user.id);

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO attendances (id, citizen_id, user_id, service_type, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'TIPO_INEXISTENTE', now(), now())`,
        citizen.id,
        user.id,
      ),
    ).rejects.toThrow();
  });
});
