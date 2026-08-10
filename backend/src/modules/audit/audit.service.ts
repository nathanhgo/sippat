import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: {
    userId: string;
    citizenId?: string;
    action: AuditAction;
    entity: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        citizenId: params.citizenId || null,
        action: params.action,
        entity: params.entity,
        metadata: params.metadata || null,
      },
    });
  }

  // Cron job to run daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleLogExpunge() {
    this.logger.log('Starting scheduled expunge of audit logs older than 3 months...');
    const result = await this.expungeOldLogs();
    this.logger.log(`Completed expunge. Deleted ${result.count} logs.`);
  }

  async expungeOldLogs() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo,
        },
      },
    });
  }
}
