import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Gender } from '@prisma/client';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('ImportService', () => {
  let service: ImportService;
  let prisma: PrismaService;

  const mockPrismaService = {
    citizen: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    attendance: {
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 'user-default-id' }),
    },
    $transaction: vi.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to generate a mock Excel buffer
  function generateMockExcelBuffer(data: any[]): Buffer {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Cadastros');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  describe('preview', () => {
    it('deve analisar planilha com sucesso e identificar novos e duplicados', async () => {
      const rows = [
        {
          CPF: '529.982.247-25',
          Nome: 'Cidadão Novo',
          'Data de Nascimento': '1990-01-01',
          Gênero: 'MASCULINO',
        },
        {
          CPF: '12345678909',
          Nome: 'Cidadão Existente',
          'Data de Nascimento': '1985-05-15',
          Gênero: 'FEMININO',
        },
        {
          CPF: 'invalid-cpf',
          Nome: 'Cidadão Inválido',
          'Data de Nascimento': '1995-10-10',
          Gênero: 'OUTRO',
        }
      ];

      const buffer = generateMockExcelBuffer(rows);

      // Simular que o primeiro CPF é novo e o segundo já existe no banco
      mockPrismaService.citizen.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-id', fullName: 'Cidadão Existente', cpf: '12345678909' });

      const result = await service.preview(buffer);

      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(1);
      expect(result.summary.duplicates).toBe(1);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].status).toBe('new');
      expect(result.rows[1].status).toBe('duplicate');
      expect(result.rows[2].status).toBe('error');
    });

    it('deve analisar com sucesso o arquivo real files/formulario.xlsx com abas Mulheres e POP', async () => {
      const filePath = path.resolve(__dirname, '../../../../files/formulario.xlsx');
      if (!fs.existsSync(filePath)) {
        return; // Pular se o arquivo não estiver presente
      }

      mockPrismaService.citizen.findUnique.mockResolvedValue(null);

      const buffer = fs.readFileSync(filePath);
      const result = await service.preview(buffer);

      expect(result.fileType).toBe('citizens');
      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.valid).toBeGreaterThan(0);

      // Encontrar uma linha com dados preenchidos de Mulheres ou POP
      const rowWithPriority = result.rows.find((r) => r.professionalProfile?.priorityGroup);
      expect(rowWithPriority).toBeDefined();
      expect(rowWithPriority?.professionalProfile.priorityGroup).toBeTruthy();

      // Verificar se campos do técnico foram capturados
      const rowWithTech = result.rows.find((r) => r.initialAttendance?.technicianName);
      expect(rowWithTech).toBeDefined();
      expect(rowWithTech?.initialAttendance.technicianWorkplace).toBeTruthy();
    });

    it('deve analisar com sucesso o arquivo real files/atendimento.xlsx', async () => {
      const filePath = path.resolve(__dirname, '../../../../files/atendimento.xlsx');
      if (!fs.existsSync(filePath)) {
        return;
      }

      const buffer = fs.readFileSync(filePath);
      const result = await service.preview(buffer);

      expect(result.fileType).toBe('atendimentos');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.summary.valid).toBeGreaterThan(0);

      // Verificar se primeira linha capturou técnico e notas
      const firstValid = result.rows[0];
      expect(firstValid.technicianName).toBeTruthy();
      expect(firstValid.notes).toBeTruthy();
    });
  });

  describe('execute', () => {
    const rowsData = [
      {
        cpf: '52998224725',
        fullName: 'Cidadão Novo',
        birthDate: '1990-01-01',
        gender: Gender.MASCULINO,
        initialAttendance: {
          technicianName: 'Carolina Costa',
          technicianWorkplace: 'CREAS II',
          notes: 'Observação teste',
        },
      },
      {
        cpf: '12345678909',
        fullName: 'Cidadão Existente',
        birthDate: '1985-05-15',
        gender: Gender.FEMININO,
      }
    ];

    it('deve importar respeitando a opção de ignorar duplicados em massa', async () => {
      mockPrismaService.citizen.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-id', fullName: 'Cidadão Existente', cpf: '12345678909' });

      mockPrismaService.citizen.create.mockResolvedValue({ id: 'new-id' });

      const result = await service.execute({
        citizens: rowsData,
        duplicateStrategy: 'ignore_all',
      }, 'user-test-id');

      expect(result.imported).toBe(1);
      expect(result.ignored).toBe(1);
      expect(result.overwritten).toBe(0);
      expect(result.errors).toBe(0);

      expect(mockPrismaService.citizen.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.citizen.update).not.toHaveBeenCalled();
      expect(mockPrismaService.attendance.create).toHaveBeenCalledTimes(1);
    });

    it('deve importar respeitando a opção de sobrescrever duplicados em massa', async () => {
      mockPrismaService.citizen.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-id', fullName: 'Cidadão Existente', cpf: '12345678909' });

      mockPrismaService.citizen.create.mockResolvedValue({ id: 'new-id' });
      mockPrismaService.citizen.update.mockResolvedValue({ id: 'existing-id' });

      const result = await service.execute({
        citizens: rowsData,
        duplicateStrategy: 'overwrite_all',
      }, 'user-test-id');

      expect(result.imported).toBe(1);
      expect(result.ignored).toBe(0);
      expect(result.overwritten).toBe(1);
      expect(result.errors).toBe(0);

      expect(mockPrismaService.citizen.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.citizen.update).toHaveBeenCalledTimes(1);
    });

    it('deve importar respeitando decisões individuais linha a linha', async () => {
      mockPrismaService.citizen.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-id', fullName: 'Cidadão Existente', cpf: '12345678909' });

      mockPrismaService.citizen.create.mockResolvedValue({ id: 'new-id' });
      mockPrismaService.citizen.update.mockResolvedValue({ id: 'existing-id' });

      const result = await service.execute({
        citizens: rowsData,
        duplicateStrategy: 'individual',
        decisions: {
          '12345678909': 'overwrite',
        },
      }, 'user-test-id');

      expect(result.imported).toBe(1);
      expect(result.ignored).toBe(0);
      expect(result.overwritten).toBe(1);
      expect(result.errors).toBe(0);

      expect(mockPrismaService.citizen.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.citizen.update).toHaveBeenCalledTimes(1);
    });
  });
});
