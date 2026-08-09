import { Test, TestingModule } from '@nestjs/testing';
import { CitizensService } from './citizens.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { Gender, RaceColor, MaritalStatus, HousingStatus } from '@prisma/client';
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
      cpf: '12345678909',
      fullName: 'Jane Doe',
      birthDate: '1990-01-01',
      gender: Gender.FEMININO,
      raceColor: RaceColor.PARDA,
      maritalStatus: MaritalStatus.SOLTEIRO,
      email: 'jane@example.com',
      zipCode: '12345678',
      socialProfile: {
        nis: '12345678901',
        perCapitaIncome: 500.50,
        housingStatus: HousingStatus.RENTED,
        familyMembersCount: 3,
        receivesBolsaFamilia: true,
        receivesBpc: false,
        isPcd: false,
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

    it('deve criptografar campos sensíveis de social_profiles antes de salvar', async () => {
      mockPrismaService.citizen.findUnique.mockResolvedValue(null);
      let capturedData: any = null;
      mockPrismaService.citizen.create.mockImplementation((args) => {
        capturedData = args.data;
        return { id: 'uuid', ...args.data };
      });

      await service.create(validDto);

      expect(capturedData).toBeDefined();
      const socialProfileData = capturedData.socialProfile.create;
      // O NIS e a Renda não devem estar em texto plano no banco de dados
      expect(socialProfileData.nis).not.toBe('12345678901');
      expect(socialProfileData.nis).toContain(':'); // Formato da criptografia (IV:TextoCriptografado)
    });
  });


describe('findOne / read', () => {
    it('deve descriptografar os campos sensíveis de social_profiles ao ler do banco', async () => {
      // Mock de dados criptografados vindo do banco
      const dbCitizen = {
        id: 'citizen-uuid',
        cpf: '12345678909',
        fullName: 'Jane Doe',
        birthDate: new Date('1990-01-01'),
        gender: Gender.FEMININO,
        raceColor: RaceColor.PARDA,
        maritalStatus: MaritalStatus.SOLTEIRO,
        socialProfile: {
          id: 'profile-uuid',
          nis: encryptHelper('12345678901'), 
          perCapitaIncome: encryptHelper('500.5'), 
          pcdDescription: null,
          receivesBolsaFamilia: true,
        },
      };

      mockPrismaService.citizen.findUnique.mockResolvedValue(dbCitizen);

      const result = await service.findOne('citizen-uuid');

      expect(result).toBeDefined();
      expect(result.socialProfile).toBeDefined();
      // O valor retornado para a aplicação deve ser o texto descriptografado correto
      expect(result.socialProfile.nis).toBe('12345678901');
      expect(result.socialProfile.perCapitaIncome).toBe(500.5);
    });
  });

  describe('findAll / advanced search', () => {
    it('deve retornar lista de cidadãos com paginação e descriptografar campos', async () => {
      const mockList = [
        {
          id: 'citizen-1',
          fullName: 'Jane Doe',
          cpf: '12345678909',
          neighborhood: 'Centro',
          socialProfile: {
            nis: encryptHelper('12345678901'),
            perCapitaIncome: encryptHelper('600'),
          },
          professionalProfile: {
            educationLevel: 'Superior Completo',
          }
        }
      ];

      mockPrismaService.citizen.findMany.mockResolvedValue(mockList);
      mockPrismaService.citizen.count.mockResolvedValue(1);

      const result = await service.findAll({
        search: 'Jane',
        neighborhood: 'Centro',
        educationLevel: 'Superior Completo',
        isPcd: false,
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.data[0].socialProfile.perCapitaIncome).toBe(600);
      expect(mockPrismaService.citizen.findMany).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deve excluir o cidadão e seus relacionamentos com sucesso', async () => {
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
