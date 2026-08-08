import { Controller, Post, Get, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  async create(@Body() createAttendanceDto: CreateAttendanceDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.attendancesService.create(createAttendanceDto, userId);
  }

  @Get('citizen/:citizenId')
  async findByCitizen(@Param('citizenId') citizenId: string) {
    return this.attendancesService.findByCitizen(citizenId);
  }
}
