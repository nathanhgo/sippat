import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { Gender, RaceColor, MaritalStatus, HousingStatus } from '@prisma/client';
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
          'Raça/Cor': 'BRANCA',
          'Estado Civil': 'SOLTEIRO',
        },
        {
          CPF: '12345678909',
          Nome: 'Cidadão Existente',
          'Data de Nascimento': '1985-05-15',
          Gênero: 'FEMININO',
          'Raça/Cor': 'PARDA',
          'Estado Civil': 'CASADO',
        },
        {
          CPF: 'invalid-cpf',
          Nome: 'Cidadão Inválido',
          'Data de Nascimento': '1995-10-10',
          Gênero: 'OUTRO',
          'Raça/Cor': 'PRETA',
          'Estado Civil': 'DIVORCIADO',
        }
      ];

      const buffer = generateMockExcelBuffer(rows);

      // Simular que o primeiro CPF é novo e o segundo já existe no banco
      mockPrismaService.citizen.findUnique
        .mockResolvedValueOnce(null) // CPF 52998224725 não existe
        .mockResolvedValueOnce({ id: 'existing-id', fullName: 'Cidadão Existente', cpf: '12345678909' }); // CPF 12345678909 existe

      const result = await service.preview(buffer);

      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(1); // 52998224725 is valid and new
      expect(result.summary.invalid).toBe(1); // invalid-cpf
      expect(result.summary.duplicates).toBe(1); // 12345678909 already exists

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].status).toBe('new');
      expect(result.rows[1].status).toBe('duplicate');
      expect(result.rows[2].status).toBe('error');
    });
  });

  describe('execute', () => {
    const rowsData = [
      {
        cpf: '52998224725',
        fullName: 'Cidadão Novo',
        birthDate: '1990-01-01',
        gender: Gender.MASCULINO,
        raceColor: RaceColor.BRANCA,
        maritalStatus: MaritalStatus.SOLTEIRO,
      },
      {
        cpf: '12345678909',
        fullName: 'Cidadão Existente',
        birthDate: '1985-05-15',
        gender: Gender.FEMININO,
        raceColor: RaceColor.PARDA,
        maritalStatus: MaritalStatus.CASADO,
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
      });

      expect(result.imported).toBe(1);
      expect(result.ignored).toBe(1);
      expect(result.overwritten).toBe(0);
      expect(result.errors).toBe(0);

      expect(mockPrismaService.citizen.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.citizen.update).not.toHaveBeenCalled();
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
      });

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
      });

      expect(result.imported).toBe(1);
      expect(result.ignored).toBe(0);
      expect(result.overwritten).toBe(1);
      expect(result.errors).toBe(0);

      expect(mockPrismaService.citizen.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.citizen.update).toHaveBeenCalledTimes(1);
    });
  });
});
