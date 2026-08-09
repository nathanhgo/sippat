import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesService } from './attendances.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    attendance: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    citizen: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve registrar um atendimento com sucesso para cidadão existente', async () => {
      const dto = {
        citizenId: 'citizen-uuid',
        serviceType: ServiceType.ORIENTACAO,
        notes: 'Alguma observação',
      };
      const userId = 'user-uuid';

      mockPrismaService.citizen.findUnique.mockResolvedValue({ id: 'citizen-uuid' });
      mockPrismaService.attendance.create.mockResolvedValue({
        id: 'attendance-uuid',
        ...dto,
        userId,
        createdAt: new Date(),
      });

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe('attendance-uuid');
      expect(mockPrismaService.citizen.findUnique).toHaveBeenCalledWith({ where: { id: 'citizen-uuid' } });
      expect(mockPrismaService.attendance.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o cidadão não existir', async () => {
      const dto = {
        citizenId: 'nonexistent-uuid',
        serviceType: ServiceType.ORIENTACAO,
      };
      
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCitizen', () => {
    it('deve retornar a lista de atendimentos ordenada por data decrescente', async () => {
      const citizenId = 'citizen-uuid';
      const mockList = [
        { id: '1', citizenId, serviceType: ServiceType.ORIENTACAO, createdAt: new Date() },
      ];

      mockPrismaService.citizen.findUnique.mockResolvedValue({ id: citizenId });
      mockPrismaService.attendance.findMany.mockResolvedValue(mockList);

      const result = await service.findByCitizen(citizenId);

      expect(result).toEqual(mockList);
      expect(mockPrismaService.attendance.findMany).toHaveBeenCalledWith({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar a lista paginada de todos os atendimentos', async () => {
      const mockList = [
        { id: '1', citizenId: 'c1', serviceType: ServiceType.ORIENTACAO, createdAt: new Date() },
      ];
      mockPrismaService.attendance.findMany.mockResolvedValue(mockList);
      mockPrismaService.attendance.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.total).toBe(1);
      expect(mockPrismaService.attendance.findMany).toHaveBeenCalled();
    });
  });
});
