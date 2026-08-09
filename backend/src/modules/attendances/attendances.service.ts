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

  async findAll(query: {
    page?: number;
    limit?: number;
    serviceType?: string;
    citizenName?: string;
    attendantName?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.serviceType) {
      where.serviceType = query.serviceType;
    }

    if (query.citizenName) {
      where.citizen = {
        fullName: { contains: query.citizenName, mode: 'insensitive' },
      };
    }

    if (query.attendantName) {
      where.user = {
        name: { contains: query.attendantName, mode: 'insensitive' },
      };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        // Include the whole end day
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          citizen: {
            select: {
              id: true,
              fullName: true,
              cpf: true,
              phone: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
