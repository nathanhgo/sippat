import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsDateString, 
  IsEnum, 
  ValidateNested, 
  IsBoolean 
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCpf } from '../validators/is-cpf.validator';
import { Gender } from '@prisma/client';

export class CreateSocialProfileDto {
  @IsOptional()
  @IsString()
  socialPrograms?: string;

  @IsOptional()
  @IsBoolean()
  isPcd?: boolean;

  @IsOptional()
  @IsString()
  disabilityCid?: string;
}

export class CreateProfessionalProfileDto {
  @IsOptional()
  @IsString()
  priorityGroup?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  courses?: any;

  @IsOptional()
  experiences?: any;

  @IsOptional()
  targetAreas?: any;
}

export class CreateCitizenDto {
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @IsString()
  @IsCpf({ message: 'CPF inválido' })
  cpf: string;

  @IsNotEmpty({ message: 'O nome completo é obrigatório' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'A data de nascimento é obrigatória' })
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  birthDate: string;

  @IsNotEmpty({ message: 'O gênero é obrigatório' })
  @IsEnum(Gender, { message: 'Gênero inválido' })
  gender: Gender;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSocialProfileDto)
  socialProfile?: CreateSocialProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfessionalProfileDto)
  professionalProfile?: CreateProfessionalProfileDto;
}
