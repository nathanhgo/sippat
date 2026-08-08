import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('deve chamar o authService.login com os dados corretos e retornar o access_token', async () => {
      const loginDto: LoginDto = {
        email: 'john@example.com',
        password: 'password123',
      };
      const mockResult = { access_token: 'mock-jwt-token' };
      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto);
      expect(result).toBe(mockResult);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
