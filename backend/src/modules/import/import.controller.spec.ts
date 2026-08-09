import { Test, TestingModule } from '@nestjs/testing';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('ImportController', () => {
  let controller: ImportController;
  let service: ImportService;

  const mockImportService = {
    preview: vi.fn(),
    execute: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        { provide: ImportService, useValue: mockImportService },
      ],
    }).compile();

    controller = module.get<ImportController>(ImportController);
    service = module.get<ImportService>(ImportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadExcel', () => {
    it('deve chamar o preview do service com o buffer do arquivo', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
      } as any;

      mockImportService.preview.mockResolvedValue({ preview: 'ok' });

      const result = await controller.uploadExcel(mockFile);

      expect(result).toEqual({ preview: 'ok' });
      expect(service.preview).toHaveBeenCalledWith(mockFile.buffer);
    });
  });

  describe('confirmImport', () => {
    it('deve chamar o execute do service com os dados fornecidos', async () => {
      const dto = {
        citizens: [],
        duplicateStrategy: 'ignore_all' as const,
      };

      mockImportService.execute.mockResolvedValue({ execute: 'ok' });

      const result = await controller.confirmImport(dto);

      expect(result).toEqual({ execute: 'ok' });
      expect(service.execute).toHaveBeenCalledWith(dto);
    });
  });
});
