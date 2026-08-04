import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  it('deve retornar status ok quando o banco de dados responde', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    const result = await controller.check();

    expect(result).toEqual({ status: 'ok', database: 'up' });
  });

  it('deve lançar ServiceUnavailableException quando o banco de dados falha', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('conexão recusada')),
    };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
