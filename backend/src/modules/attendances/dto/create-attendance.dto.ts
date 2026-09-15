import { IsNotEmpty, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateAttendanceDto {
  @IsUUID(4, { message: 'ID do cidadão inválido' })
  @IsNotEmpty({ message: 'O cidadão é obrigatório' })
  citizenId: string;

  @IsEnum(ServiceType, { message: 'Tipo de serviço inválido' })
  @IsNotEmpty({ message: 'O tipo de serviço é obrigatório' })
  serviceType: ServiceType;

  @IsString({ message: 'Notas devem ser texto' })
  @IsOptional()
  notes?: string;

  @IsString({ message: 'Nome do técnico deve ser texto' })
  @IsOptional()
  technicianName?: string;

  @IsString({ message: 'Local de trabalho do técnico deve ser texto' })
  @IsOptional()
  technicianWorkplace?: string;

  @IsString({ message: 'Contato do técnico deve ser texto' })
  @IsOptional()
  technicianContact?: string;
}
