import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { ServiceType } from '@prisma/client';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('AttendancesController', () => {
  let controller: AttendancesController;
  let service: AttendancesService;

  const mockAttendancesService = {
    create: vi.fn(),
    findByCitizen: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancesController],
      providers: [
        { provide: AttendancesService, useValue: mockAttendancesService },
      ],
    }).compile();

    controller = module.get<AttendancesController>(AttendancesController);
    service = module.get<AttendancesService>(AttendancesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve chamar service.create com os parâmetros e o id do usuario logado', async () => {
      const dto = {
        citizenId: 'citizen-uuid',
        serviceType: ServiceType.ORIENTACAO,
        notes: 'obs',
      };
      const req = { user: { sub: 'user-uuid' } };
      const mockResponse = { id: 'attendance-uuid', ...dto, userId: 'user-uuid' };

      mockAttendancesService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(dto, req);

      expect(result).toBe(mockResponse);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-uuid');
    });
  });

  describe('findByCitizen', () => {
    it('deve chamar service.findByCitizen com o id do cidadão', async () => {
      const citizenId = 'citizen-uuid';
      const mockResult = [{ id: '1', citizenId, serviceType: ServiceType.ORIENTACAO }];

      mockAttendancesService.findByCitizen.mockResolvedValue(mockResult);

      const result = await controller.findByCitizen(citizenId);

      expect(result).toBe(mockResult);
      expect(service.findByCitizen).toHaveBeenCalledWith(citizenId);
    });
  });
});
