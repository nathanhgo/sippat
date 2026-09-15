import { Test, TestingModule } from '@nestjs/testing';
import { CitizensService } from './citizens.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { Gender } from '@prisma/client';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = 'a87b92f7c001db222f9872ea5a176865';

function encryptHelper(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

describe('CitizensService', () => {
  let service: CitizensService;
  let prisma: PrismaService;

  const mockPrismaService = {
    citizen: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    socialProfile: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    professionalProfile: {
      deleteMany: vi.fn(),
    },
    attendance: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((arg) => (typeof arg === 'function' ? arg(mockPrismaService) : Promise.all(arg))),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitizensService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CitizensService>(CitizensService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto: CreateCitizenDto = {
      cpf: '52998224725',
      fullName: 'Jane Doe',
      birthDate: '1990-01-01',
      gender: Gender.FEMININO,
      phone: '12987654321',
      neighborhood: 'Centro',
      socialProfile: {
        isPcd: true,
        disabilityCid: 'F84.0',
        socialPrograms: 'Bolsa Família',
      },
      professionalProfile: {
        priorityGroup: 'Fluxo Municipal da Mulher',
        educationLevel: 'Médio completo',
      },
    };

    it('deve criar um cidadão com sucesso e retornar o cidadão criado', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);
      mockPrismaService.citizen.create.mockImplementation((args) => {
        return {
          id: 'citizen-uuid',
          ...args.data,
          socialProfile: {
            id: 'profile-uuid',
            ...args.data.socialProfile?.create,
          },
          professionalProfile: {
            id: 'prof-uuid',
            ...args.data.professionalProfile?.create,
          },
        };
      });

      const result = await service.create(validDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('citizen-uuid');
      expect(mockPrismaService.citizen.create).toHaveBeenCalled();
    });

    it('deve rejeitar criação se o CPF já estiver cadastrado', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue({ id: 'existing-id', cpf: validDto.cpf });

      await expect(service.create(validDto)).rejects.toThrow('CPF já cadastrado');
    });

    it('deve criptografar campos sensíveis de social_profiles (socialPrograms e disabilityCid) antes de salvar', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);
      let capturedData: any = null;
      mockPrismaService.citizen.create.mockImplementation((args) => {
        capturedData = args.data;
        return { id: 'uuid', ...args.data };
      });

      await service.create(validDto);

      expect(capturedData).toBeDefined();
      const socialProfileData = capturedData.socialProfile.create;
      expect(socialProfileData.socialPrograms).not.toBe('Bolsa Família');
      expect(socialProfileData.socialPrograms).toContain(':');
      expect(socialProfileData.disabilityCid).not.toBe('F84.0');
      expect(socialProfileData.disabilityCid).toContain(':');
    });
  });

  describe('findOne / read', () => {
    it('deve descriptografar os campos sensíveis de social_profiles ao ler do banco', async () => {
      const dbCitizen = {
        id: 'citizen-uuid',
        cpf: '52998224725',
        fullName: 'Jane Doe',
        birthDate: new Date('1990-01-01'),
        gender: Gender.FEMININO,
        neighborhood: 'Centro',
        socialProfile: {
          id: 'profile-uuid',
          isPcd: true,
          socialPrograms: encryptHelper('Bolsa Família'),
          disabilityCid: encryptHelper('F84.0'),
        },
        professionalProfile: {
          id: 'prof-uuid',
          priorityGroup: 'Fluxo Municipal da Mulher',
        },
      };

      mockPrismaService.citizen.findUnique.mockResolvedValue(dbCitizen);

      const result = await service.findOne('citizen-uuid');

      expect(result).toBeDefined();
      expect(result.socialProfile).toBeDefined();
      expect(result.socialProfile.socialPrograms).toBe('Bolsa Família');
      expect(result.socialProfile.disabilityCid).toBe('F84.0');
    });

    it('deve lançar NotFoundException quando cidadão não for encontrado', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow('Cidadão não encontrado');
    });
  });

  describe('update', () => {
    it('deve atualizar um cidadão existente e seus perfis com sucesso', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue({ id: 'citizen-1' });
      mockPrismaService.citizen.update.mockResolvedValue({
        id: 'citizen-1',
        fullName: 'Jane Updated',
        cpf: '52998224725',
        socialProfile: {
          socialPrograms: encryptHelper('BPC'),
          isPcd: true,
          disabilityCid: encryptHelper('G80.0'),
        },
        professionalProfile: {
          priorityGroup: 'Fluxo Municipal da Mulher',
        },
      });

      const result = await service.update('citizen-1', {
        fullName: 'Jane Updated',
        socialProfile: {
          socialPrograms: 'BPC',
          isPcd: true,
          disabilityCid: 'G80.0',
        },
        professionalProfile: {
          priorityGroup: 'Fluxo Municipal da Mulher',
        },
      });

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Jane Updated');
      expect(result.socialProfile.socialPrograms).toBe('BPC');
      expect(result.socialProfile.disabilityCid).toBe('G80.0');
      expect(mockPrismaService.citizen.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao tentar atualizar cidadão inexistente', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { fullName: 'Teste' })).rejects.toThrow('Cidadão não encontrado');
    });
  });

  describe('findAll / advanced search', () => {
    it('deve retornar lista de cidadãos com paginação, filtros e descriptografar campos', async () => {
      const mockList = [
        {
          id: 'citizen-1',
          fullName: 'Jane Doe',
          cpf: '52998224725',
          neighborhood: 'Centro',
          socialProfile: {
            isPcd: true,
            socialPrograms: encryptHelper('Bolsa Família'),
            disabilityCid: encryptHelper('F84.0'),
          },
          professionalProfile: {
            priorityGroup: 'Fluxo Municipal da Mulher',
            educationLevel: 'Superior Completo',
          },
        },
      ];

      mockPrismaService.citizen.findMany.mockResolvedValue(mockList);
      mockPrismaService.citizen.count.mockResolvedValue(1);

      const result = await service.findAll({
        search: 'Jane',
        neighborhood: 'Centro',
        educationLevel: 'Superior Completo',
        priorityGroup: 'Fluxo Municipal da Mulher',
        isPcd: true,
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.data[0].socialProfile.socialPrograms).toBe('Bolsa Família');
      expect(result.data[0].socialProfile.disabilityCid).toBe('F84.0');
      expect(mockPrismaService.citizen.findMany).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deve excluir o cidadão e seus relacionamentos com sucesso em transação', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue({ id: 'citizen-1' });

      const result = await service.delete('citizen-1');

      expect(result).toBeDefined();
      expect(result.message).toBe('Cidadão excluído com sucesso');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve lançar exceção ao tentar excluir cidadão inexistente', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow('Cidadão não encontrado');
    });
  });
});
