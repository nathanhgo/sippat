import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsDateString, 
  IsEnum, 
  IsEmail, 
  ValidateNested, 
  IsNumber, 
  IsBoolean, 
  IsInt,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsCpf } from '../validators/is-cpf.validator';
import { IsNis } from '../validators/is-nis.validator';
import { IsCep } from '../validators/is-cep.validator';
import { Gender, RaceColor, MaritalStatus, HousingStatus } from '@prisma/client';

export class CreateSocialProfileDto {
  @IsOptional()
  @IsNis({ message: 'NIS inválido' })
  nis?: string;

  @IsOptional()
  @IsNumber()
  perCapitaIncome?: number;

  @IsOptional()
  @IsEnum(HousingStatus)
  housingStatus?: HousingStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  familyMembersCount?: number;

  @IsOptional()
  @IsBoolean()
  receivesBolsaFamilia?: boolean;

  @IsOptional()
  @IsBoolean()
  receivesBpc?: boolean;

  @IsOptional()
  @IsBoolean()
  isPcd?: boolean;

  @IsOptional()
  @IsString()
  pcdDescription?: string;
}

export class CreateProfessionalProfileDto {
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsString({ each: true })
  courses?: string[];

  @IsOptional()
  experiences?: any;

  @IsOptional()
  @IsString({ each: true })
  targetAreas?: string[];
}

export class CreateCitizenDto {
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @IsString()
  @IsCpf({ message: 'CPF inválido' })
  cpf: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsNotEmpty({ message: 'O nome completo é obrigatório' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'A data de nascimento é obrigatória' })
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  birthDate: string;

  @IsNotEmpty({ message: 'O gênero é obrigatório' })
  @IsEnum(Gender, { message: 'Gênero inválido' })
  gender: Gender;

  @IsNotEmpty({ message: 'A raça/cor é obrigatória' })
  @IsEnum(RaceColor, { message: 'Raça/cor inválida' })
  raceColor: RaceColor;

  @IsNotEmpty({ message: 'O estado civil é obrigatório' })
  @IsEnum(MaritalStatus, { message: 'Estado civil inválido' })
  maritalStatus: MaritalStatus;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  addressStreet?: string;

  @IsOptional()
  @IsString()
  addressNumber?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsCep({ message: 'CEP inválido' })
  zipCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSocialProfileDto)
  socialProfile?: CreateSocialProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfessionalProfileDto)
  professionalProfile?: CreateProfessionalProfileDto;
}
