import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { ImportModule } from './modules/import/import.module';
import { AuditModule } from './modules/audit/audit.module';
import { DataRetentionModule } from './modules/data-retention/data-retention.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    CitizensModule,
    AttendancesModule,
    ImportModule,
    AuditModule,
    DataRetentionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
