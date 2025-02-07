import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorService } from './sector.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SectorResponseDto } from './dto/sector-response.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Sectors')
@Controller('sectors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Get()
  @Roles(Role.Admin,Role.User)
  @ApiOperation({ summary: 'Get all sectors' })
  @ApiResponse({
    status: 200,
    description: 'List of all sectors',
    type: [SectorResponseDto],
  })
  findAll() {
    return this.sectorService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin,Role.User)
  @ApiOperation({ summary: 'Get sector by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Sector ID' })
  @ApiResponse({
    status: 200,
    description: 'Sector details retrieved successfully',
    type: SectorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sector not found',
  })
  findOne(@Param('id') id: string) {
    return this.sectorService.findById(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new sector' })
  @ApiResponse({
    status: 201,
    description: 'Sector created successfully',
    type: SectorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Sector with the same seriesCode already exists',
    schema: {
      example: {
        statusCode: 409,
        message: "Sector with seriesCode 'EN.ATM.GHGT.ZG' already exists",
        error: 'Conflict',
      },
    },
  })
  @ApiBody({ type: CreateSectorDto })
  create(@Body() createSectorDto: CreateSectorDto) {
    return this.sectorService.create(createSectorDto);
  }

  @Post('bulk')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Add multiple sectors' })
  @ApiResponse({
    status: 201,
    description: 'Multiple sectors created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiBody({ type: [CreateSectorDto] })
  async createEmissions(@Body() body: CreateSectorDto[]) {
    return this.sectorService.createMany(body);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Soft delete a sector by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Sector ID to be deleted' })
  @ApiResponse({
    status: 200,
    description: 'Sector soft deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Sector not found',
  })
  remove(@Param('id') id: string) {
    return this.sectorService.softDelete(id);
  }
}