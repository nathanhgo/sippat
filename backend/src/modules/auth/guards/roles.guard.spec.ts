import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (userRole?: Role): ExecutionContext => {
    const request = userRole ? { user: { role: userRole } } : {};
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('deve permitir acesso se nenhum perfil (role) for exigido pela rota', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('deve permitir acesso se o perfil do usuário for ADMIN e a rota exigir ADMIN', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.ADMIN);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('deve bloquear acesso se o perfil do usuário for ATTENDANT e a rota exigir ADMIN', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext(Role.ATTENDANT);

    const result = guard.canActivate(context);
    expect(result).toBe(false);
  });

  it('deve permitir acesso se a rota exigir tanto ADMIN quanto ATTENDANT e o usuário for ATTENDANT', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.ATTENDANT]);
    const context = createMockContext(Role.ATTENDANT);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('deve bloquear acesso se o usuário não estiver autenticado/ausente na requisição', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    const result = guard.canActivate(context);
    expect(result).toBe(false);
  });
});
