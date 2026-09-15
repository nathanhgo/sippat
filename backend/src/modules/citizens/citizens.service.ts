import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a87b92f7c001db222f9872ea5a176865'; // 32 bytes

function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  if (!text) return text;
  const parts = text.split(':');
  if (parts.length !== 2) return text; // Not encrypted
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

@Injectable()
export class CitizensService {
  constructor(private readonly prisma: PrismaService) {}

  private decryptCitizen(citizen: any) {
    if (citizen && citizen.socialProfile) {
      if (citizen.socialProfile.socialPrograms) {
        citizen.socialProfile.socialPrograms = decrypt(citizen.socialProfile.socialPrograms);
      }
      if (citizen.socialProfile.disabilityCid) {
        citizen.socialProfile.disabilityCid = decrypt(citizen.socialProfile.disabilityCid);
      }
    }
    return citizen;
  }

  async create(createCitizenDto: CreateCitizenDto) {
    const existing = await this.prisma.citizen.findUnique({
      where: { cpf: createCitizenDto.cpf },
    });

    if (existing) {
      throw new BadRequestException('CPF já cadastrado');
    }

    const { socialProfile, professionalProfile, ...citizenData } = createCitizenDto;

    const data: any = {
      ...citizenData,
      birthDate: new Date(citizenData.birthDate),
    };

    if (socialProfile) {
      data.socialProfile = {
        create: {
          socialPrograms: socialProfile.socialPrograms ? encrypt(socialProfile.socialPrograms) : undefined,
          isPcd: socialProfile.isPcd ?? false,
          disabilityCid: socialProfile.disabilityCid ? encrypt(socialProfile.disabilityCid) : undefined,
        },
      };
    }

    if (professionalProfile) {
      data.professionalProfile = {
        create: {
          priorityGroup: professionalProfile.priorityGroup,
          educationLevel: professionalProfile.educationLevel,
          courses: professionalProfile.courses,
          experiences: professionalProfile.experiences,
          targetAreas: professionalProfile.targetAreas,
        },
      };
    }

    const created = await this.prisma.citizen.create({
      data,
      include: {
        socialProfile: true,
        professionalProfile: true,
      },
    });

    return this.decryptCitizen(created);
  }

  async findOne(id: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
      include: {
        socialProfile: true,
        professionalProfile: true,
        attendances: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!citizen) {
      throw new NotFoundException('Cidadão não encontrado');
    }

    return this.decryptCitizen(citizen);
  }

  async findAll(query: {
    search?: string;
    neighborhood?: string;
    educationLevel?: string;
    isPcd?: boolean;
    priorityGroup?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { cpf: { contains: query.search } },
      ];
    }

    if (query.neighborhood) {
      where.neighborhood = { contains: query.neighborhood, mode: 'insensitive' };
    }

    if (query.educationLevel || query.priorityGroup) {
      where.professionalProfile = {};
      if (query.educationLevel) {
        where.professionalProfile.educationLevel = { contains: query.educationLevel, mode: 'insensitive' };
      }
      if (query.priorityGroup) {
        where.professionalProfile.priorityGroup = { contains: query.priorityGroup, mode: 'insensitive' };
      }
    }

    if (query.isPcd !== undefined) {
      const isPcdBool = String(query.isPcd) === 'true';
      where.socialProfile = {
        isPcd: isPcdBool,
      };
    }

    const [citizens, total] = await Promise.all([
      this.prisma.citizen.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          socialProfile: true,
          professionalProfile: true,
        },
      }),
      this.prisma.citizen.count({ where }),
    ]);

    const decryptedCitizens = citizens.map((c) => this.decryptCitizen(c));

    return {
      data: decryptedCitizens,
      total,
      page,
      limit,
    };
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
    });

    if (!citizen) {
      throw new NotFoundException('Cidadão não encontrado');
    }

    const { socialProfile, professionalProfile, ...citizenData } = updateCitizenDto;

    const data: any = {
      ...citizenData,
    };
    if (citizenData.birthDate) {
      data.birthDate = new Date(citizenData.birthDate);
    }

    if (socialProfile) {
      data.socialProfile = {
        upsert: {
          create: {
            socialPrograms: socialProfile.socialPrograms ? encrypt(socialProfile.socialPrograms) : undefined,
            isPcd: socialProfile.isPcd ?? false,
            disabilityCid: socialProfile.disabilityCid ? encrypt(socialProfile.disabilityCid) : undefined,
          },
          update: {
            socialPrograms: socialProfile.socialPrograms ? encrypt(socialProfile.socialPrograms) : undefined,
            isPcd: socialProfile.isPcd !== undefined ? socialProfile.isPcd : undefined,
            disabilityCid: socialProfile.disabilityCid ? encrypt(socialProfile.disabilityCid) : undefined,
          },
        },
      };
    }

    if (professionalProfile) {
      data.professionalProfile = {
        upsert: {
          create: {
            priorityGroup: professionalProfile.priorityGroup,
            educationLevel: professionalProfile.educationLevel,
            courses: professionalProfile.courses,
            experiences: professionalProfile.experiences,
            targetAreas: professionalProfile.targetAreas,
          },
          update: {
            priorityGroup: professionalProfile.priorityGroup,
            educationLevel: professionalProfile.educationLevel,
            courses: professionalProfile.courses,
            experiences: professionalProfile.experiences,
            targetAreas: professionalProfile.targetAreas,
          },
        },
      };
    }

    const updated = await this.prisma.citizen.update({
      where: { id },
      data,
      include: {
        socialProfile: true,
        professionalProfile: true,
      },
    });

    return this.decryptCitizen(updated);
  }

  async delete(id: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
    });

    if (!citizen) {
      throw new NotFoundException('Cidadão não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { citizenId: id } });
      await tx.socialProfile.deleteMany({ where: { citizenId: id } });
      await tx.professionalProfile.deleteMany({ where: { citizenId: id } });
      await tx.citizen.delete({ where: { id } });
    });

    return { message: 'Cidadão excluído com sucesso' };
  }
}
