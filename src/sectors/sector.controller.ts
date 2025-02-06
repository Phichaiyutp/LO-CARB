import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorService } from './sector.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('sectors')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}
  @Get()
  findAll() {
    return this.sectorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectorService.findByCode(id);
  }

  @Post()
  create(@Body() createSectorDto: CreateSectorDto) {
    return this.sectorService.create(createSectorDto);
  }
  
  @Post('bulk')
  @ApiOperation({ summary: 'Add multiple greenhouse gas emission records' })
  @ApiResponse({
    status: 201,
    description: 'Multiple emission records created successfully',
  })
  @ApiBody({ type: [CreateSectorDto] })
  async createEmissions(@Body() body: CreateSectorDto[]) {
    return this.sectorService.createMany(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectorService.softDelete(id);
  }
}
