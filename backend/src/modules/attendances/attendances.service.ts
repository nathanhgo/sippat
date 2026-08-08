import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAttendanceDto: CreateAttendanceDto, userId: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: createAttendanceDto.citizenId },
    });

    if (!citizen) {
      throw new NotFoundException('Cidadão não encontrado');
    }

    return this.prisma.attendance.create({
      data: {
        citizenId: createAttendanceDto.citizenId,
        userId,
        serviceType: createAttendanceDto.serviceType,
        notes: createAttendanceDto.notes,
      },
    });
  }

  async findByCitizen(citizenId: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id: citizenId },
    });

    if (!citizen) {
      throw new NotFoundException('Cidadão não encontrado');
    }

    return this.prisma.attendance.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
