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
      if (citizen.socialProfile.nis) {
        citizen.socialProfile.nis = decrypt(citizen.socialProfile.nis);
      }
      if (citizen.socialProfile.perCapitaIncome) {
        const decryptedIncome = decrypt(citizen.socialProfile.perCapitaIncome);
        citizen.socialProfile.perCapitaIncome = decryptedIncome ? parseFloat(decryptedIncome) : null;
      }
      if (citizen.socialProfile.pcdDescription) {
        citizen.socialProfile.pcdDescription = decrypt(citizen.socialProfile.pcdDescription);
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
          nis: socialProfile.nis ? encrypt(socialProfile.nis) : undefined,
          perCapitaIncome: socialProfile.perCapitaIncome !== undefined ? encrypt(String(socialProfile.perCapitaIncome)) : undefined,
          housingStatus: socialProfile.housingStatus,
          familyMembersCount: socialProfile.familyMembersCount,
          receivesBolsaFamilia: socialProfile.receivesBolsaFamilia,
          receivesBpc: socialProfile.receivesBpc,
          isPcd: socialProfile.isPcd,
          pcdDescription: socialProfile.pcdDescription ? encrypt(socialProfile.pcdDescription) : undefined,
        },
      };
    }

    if (professionalProfile) {
      data.professionalProfile = {
        create: {
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
      },
    });

    if (!citizen) {
      throw new NotFoundException('Cidadão não encontrado');
    }

    return this.decryptCitizen(citizen);
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
            nis: socialProfile.nis ? encrypt(socialProfile.nis) : undefined,
            perCapitaIncome: socialProfile.perCapitaIncome !== undefined ? encrypt(String(socialProfile.perCapitaIncome)) : undefined,
            housingStatus: socialProfile.housingStatus,
            familyMembersCount: socialProfile.familyMembersCount,
            receivesBolsaFamilia: socialProfile.receivesBolsaFamilia,
            receivesBpc: socialProfile.receivesBpc,
            isPcd: socialProfile.isPcd,
            pcdDescription: socialProfile.pcdDescription ? encrypt(socialProfile.pcdDescription) : undefined,
          },
          update: {
            nis: socialProfile.nis ? encrypt(socialProfile.nis) : undefined,
            perCapitaIncome: socialProfile.perCapitaIncome !== undefined ? encrypt(String(socialProfile.perCapitaIncome)) : undefined,
            housingStatus: socialProfile.housingStatus,
            familyMembersCount: socialProfile.familyMembersCount,
            receivesBolsaFamilia: socialProfile.receivesBolsaFamilia,
            receivesBpc: socialProfile.receivesBpc,
            isPcd: socialProfile.isPcd,
            pcdDescription: socialProfile.pcdDescription ? encrypt(socialProfile.pcdDescription) : undefined,
          },
        },
      };
    }

    if (professionalProfile) {
      data.professionalProfile = {
        upsert: {
          create: {
            educationLevel: professionalProfile.educationLevel,
            courses: professionalProfile.courses,
            experiences: professionalProfile.experiences,
            targetAreas: professionalProfile.targetAreas,
          },
          update: {
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
}
