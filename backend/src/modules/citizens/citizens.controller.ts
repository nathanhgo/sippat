import { Controller, Post, Body, Patch, Param, Get, Query, UseGuards } from '@nestjs/common';
import { CitizensService } from './citizens.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('citizens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Post()
  async create(@Body() createCitizenDto: CreateCitizenDto) {
    return this.citizensService.create(createCitizenDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.citizensService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.citizensService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto) {
    return this.citizensService.update(id, updateCitizenDto);
  }
}
