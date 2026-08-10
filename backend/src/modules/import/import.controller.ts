import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: any) {
    return this.importService.preview(file.buffer);
  }

  @Post('confirm')
  async confirmImport(
    @Body()
    dto: {
      citizens: any[];
      duplicateStrategy: 'overwrite_all' | 'ignore_all' | 'individual';
      decisions?: Record<string, 'overwrite' | 'ignore'>;
    },
  ) {
    return this.importService.execute(dto);
  }
}
