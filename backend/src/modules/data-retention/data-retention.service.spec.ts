import { Test, TestingModule } from '@nestjs/testing';
import { DataRetentionService } from './data-retention.service';
import { PrismaService } from '../../prisma/prisma.service';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('DataRetentionService', () => {
  let service: DataRetentionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    citizen: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataRetentionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DataRetentionService>(DataRetentionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('anonimizeInactiveCitizens', () => {
    it('deve identificar e anonimizar cidadãos inativos há mais de 1 ano', async () => {
      // Simular que o cidadão inativo não tem atendimentos recentes ou nenhum atendimento
      const inactiveCitizen = {
        id: 'inactive-id',
        cpf: '12345678909',
        fullName: 'Maria Inativa',
        rg: '1234567',
        phone: '123456789',
        email: 'maria@example.com',
        addressStreet: 'Rua das Flores',
        addressNumber: '100',
        zipCode: '12345678',
        socialProfile: {
          id: 'profile-id',
          nis: '12345678901',
          perCapitaIncome: '100',
          pcdDescription: 'Nenhuma',
        },
        attendances: [], // Sem atendimentos
      };

      mockPrismaService.citizen.findMany.mockResolvedValue([inactiveCitizen]);
      mockPrismaService.citizen.update.mockResolvedValue({ id: 'inactive-id' });

      const result = await service.anonimizeInactiveCitizens();

      expect(result.count).toBe(1);
      expect(mockPrismaService.citizen.findMany).toHaveBeenCalled();
      expect(mockPrismaService.citizen.update).toHaveBeenCalledWith({
        where: { id: 'inactive-id' },
        data: {
          fullName: 'CIDADÃO ANONIMIZADO',
          cpf: expect.any(String), // Deve randomizar ou mascarar o CPF
          rg: null,
          phone: null,
          email: null,
          addressStreet: null,
          addressNumber: null,
          zipCode: null,
          deletedAt: expect.any(Date),
          socialProfile: {
            update: {
              nis: null,
              perCapitaIncome: null,
              pcdDescription: null,
            },
          },
        },
      });
    });

    it('não deve anonimizar cidadãos ativos com atendimentos recentes', async () => {
      // Simular que o cidadão tem atendimentos recentes, logo não deve ser retornado por findMany
      mockPrismaService.citizen.findMany.mockResolvedValue([]);

      const result = await service.anonimizeInactiveCitizens();

      expect(result.count).toBe(0);
      expect(mockPrismaService.citizen.update).not.toHaveBeenCalled();
    });
  });
});
