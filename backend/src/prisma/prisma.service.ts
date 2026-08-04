import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Encapsula o PrismaClient e conecta/desconecta junto ao ciclo de vida do módulo Nest.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado ao banco de dados via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
