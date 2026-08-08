import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {}
