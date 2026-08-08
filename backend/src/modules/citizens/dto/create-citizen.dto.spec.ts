import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateCitizenDto } from './create-citizen.dto';
import { Gender, RaceColor, MaritalStatus } from '@prisma/client';
import { describe, it, expect } from 'vitest';

describe('CreateCitizenDto Validation', () => {
  const getValidDto = (): CreateCitizenDto => {
    const dto = new CreateCitizenDto();
    dto.cpf = '52998224725'; // Mathematically valid CPF
    dto.fullName = 'Jane Doe';
    dto.birthDate = '1990-01-01T00:00:00.000Z';
    dto.gender = Gender.FEMININO;
    dto.raceColor = RaceColor.PARDA;
    dto.maritalStatus = MaritalStatus.SOLTEIRO;
    dto.email = 'jane@example.com';
    dto.zipCode = '12345678';
    return dto;
  };

  it('deve passar na validação com um DTO 100% válido', async () => {
    const dto = getValidDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('deve rejeitar se o CPF for inválido', async () => {
    const dto = getValidDto();
    dto.cpf = '11111111111'; // Invalid CPF (same digits)
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cpf');
  });

  it('deve rejeitar se o NIS no socialProfile for inválido', async () => {
    const dto = getValidDto();
    dto.socialProfile = {
      nis: '1234', // Invalid NIS (too short/wrong formula)
    };
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    // Drill down into nested validation errors
    expect(errors[0].property).toBe('socialProfile');
  });

  it('deve rejeitar se o CEP estiver em formato incorreto', async () => {
    const dto = getValidDto();
    dto.zipCode = '123'; // Invalid CEP
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('zipCode');
  });

  it('deve rejeitar se o e-mail estiver em formato incorreto', async () => {
    const dto = getValidDto();
    dto.email = 'invalid-email';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
