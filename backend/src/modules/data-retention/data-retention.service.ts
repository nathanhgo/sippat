import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDataRetention() {
    this.logger.log('Starting scheduled data retention / anonymization job...');
    const result = await this.anonimizeInactiveCitizens();
    this.logger.log(`Completed data retention. Anonymized ${result.count} citizens.`);
  }

  async anonimizeInactiveCitizens() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const inactiveCitizens = await this.prisma.citizen.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          lt: oneYearAgo,
        },
        OR: [
          {
            attendances: {
              none: {},
            },
          },
          {
            attendances: {
              every: {
                createdAt: {
                  lt: oneYearAgo,
                },
              },
            },
          },
        ],
      },
    });

    let count = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const citizen of inactiveCitizens) {
        // Update citizen to mask all sensitive and PII fields
        // Since CPF is unique, we replace it with a unique anonymous mask
        const anonymousCpf = `ANON-${crypto.randomUUID().slice(0, 18)}`;

        await tx.citizen.update({
          where: { id: citizen.id },
          data: {
            fullName: 'CIDADÃO ANONIMIZADO',
            cpf: anonymousCpf,
            rg: null,
            phone: null,
            email: null,
            addressStreet: null,
            addressNumber: null,
            zipCode: null,
            deletedAt: new Date(),
            socialProfile: {
              update: {
                nis: null,
                perCapitaIncome: null,
                pcdDescription: null,
              },
            },
          },
        });

        count++;
      }
    });

    return {
      count,
    };
  }
}
