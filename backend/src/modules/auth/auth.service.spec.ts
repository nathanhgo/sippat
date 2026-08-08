import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
    },
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('deve gerar hash de senha com bcrypt e nunca retornar senha em texto plano', async () => {
      const password = 'my-secret-password';
      const hash = await service.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      
      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);
    });
  });

  describe('validateUser', () => {
    it('deve autenticar usuário com credenciais válidas e retornar os dados do usuário sem o password_hash', async () => {
      const plainPassword = 'password123';
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        role: 'ATTENDANT',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('john@example.com', plainPassword);
      expect(result).toBeDefined();
      expect(result.email).toBe('john@example.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('deve rejeitar login com senha incorreta e retornar null', async () => {
      const plainPassword = 'password123';
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        role: 'ATTENDANT',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('john@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('deve rejeitar login com e-mail inexistente e retornar null', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password123');
      expect(result).toBeNull();
    });

    it('deve rejeitar login se o usuário estiver inativo e retornar null', async () => {
      const plainPassword = 'password123';
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        role: 'ATTENDANT',
        isActive: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('john@example.com', plainPassword);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('deve autenticar usuário com credenciais válidas e retornar um JWT válido', async () => {
      const plainPassword = 'password123';
      vi.spyOn(service, 'validateUser').mockResolvedValue({
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'ATTENDANT',
        isActive: true,
      });

      const result = await service.login({ email: 'john@example.com', password: plainPassword });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        email: 'john@example.com',
        role: 'ATTENDANT',
      });
    });

    it('deve rejeitar login com senha incorreta com UnauthorizedException genérica', async () => {
      vi.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: 'john@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve rejeitar login com e-mail inexistente com UnauthorizedException genérica', async () => {
      vi.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
