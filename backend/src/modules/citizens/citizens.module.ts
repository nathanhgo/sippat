import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {}
