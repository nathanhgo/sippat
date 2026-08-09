import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const method = request.method;
    const url = request.url;

    let action: AuditAction;
    if (method === 'POST') {
      action = AuditAction.CREATE;
    } else if (method === 'PATCH' || method === 'PUT') {
      action = AuditAction.UPDATE;
    } else if (method === 'DELETE') {
      action = AuditAction.DELETE;
    } else {
      action = AuditAction.READ;
    }

    return next.handle().pipe(
      tap(async (data) => {
        if (!userId) return;

        try {
          let citizenId: string | undefined;

          if (action === AuditAction.DELETE) {
            citizenId = undefined; // Avoid FK violation on deleted citizen
          } else if (request.params?.id) {
            citizenId = request.params.id;
          } else if (data?.id) {
            citizenId = data.id;
          } else if (data?.citizenId) {
            citizenId = data.citizenId;
          }

          const metadata = {
            url,
            method,
            ...(action === AuditAction.DELETE && request.params?.id ? { deletedCitizenId: request.params.id } : {}),
          };

          await this.auditService.createLog({
            userId,
            citizenId,
            action,
            entity: 'citizen',
            metadata,
          });
        } catch (error) {
          // Log error silently without failing the response
          console.error('AuditInterceptor log creation failed:', error);
        }
      }),
    );
  }
}
