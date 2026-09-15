import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateCitizenDto, CreateSocialProfileDto, CreateProfessionalProfileDto } from './create-citizen.dto';
import { Gender } from '@prisma/client';
import { describe, it, expect } from 'vitest';

describe('CreateCitizenDto Validation', () => {
  const getValidDto = (): CreateCitizenDto => {
    const dto = new CreateCitizenDto();
    dto.cpf = '52998224725'; // Mathematically valid CPF
    dto.fullName = 'Jane Doe';
    dto.birthDate = '1990-01-01T00:00:00.000Z';
    dto.gender = Gender.FEMININO;
    dto.phone = '12999999999';
    dto.neighborhood = 'Centro';
    dto.socialProfile = Object.assign(new CreateSocialProfileDto(), {
      isPcd: true,
      disabilityCid: 'F84.0',
      socialPrograms: 'Bolsa Família',
    });
    dto.professionalProfile = Object.assign(new CreateProfessionalProfileDto(), {
      priorityGroup: 'Fluxo Municipal da Mulher',
      educationLevel: 'Médio completo',
      targetAreas: ['Atendimento ao público'],
    });
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

  it('deve rejeitar se o nome completo for vazio', async () => {
    const dto = getValidDto();
    dto.fullName = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fullName');
  });

  it('deve rejeitar se a data de nascimento for inválida', async () => {
    const dto = getValidDto();
    dto.birthDate = 'invalid-date';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('birthDate');
  });

  it('deve rejeitar se o gênero for inválido', async () => {
    const dto = getValidDto();
    dto.gender = 'INVALIDO' as any;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('gender');
  });
});
