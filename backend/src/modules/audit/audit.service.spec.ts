import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('deve criar uma entrada de log com sucesso', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-id' });

      await service.createLog({
        userId: 'user-id',
        citizenId: 'citizen-id',
        action: AuditAction.CREATE,
        entity: 'citizen',
        metadata: { field: 'value' },
      });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          citizenId: 'citizen-id',
          action: AuditAction.CREATE,
          entity: 'citizen',
          metadata: { field: 'value' },
        },
      });
    });
  });

  describe('expungeOldLogs', () => {
    it('deve excluir logs com mais de 3 meses', async () => {
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.expungeOldLogs();

      expect(result.count).toBe(5);
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });
});
