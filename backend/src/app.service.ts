import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SIPPAT API - PAT Jacareí';
  }
}
