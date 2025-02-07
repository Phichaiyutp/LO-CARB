import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { EmissionsService } from './emissions.service';
import { CreateEmissionDto } from './dto/create-emissions.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiQuery,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  EmissionBySectorResponseDto,
  EmissionResponseDto,
  EmissionTrendDataResponseDto,
  PaginatedEmissionBySummaryResponseDto,
  PaginatedEmissionGasResponseDto,
  PaginatedEmissionResponseDto,
} from './dto/emission-response.dto';

@ApiTags('Emissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Controller('emissions')
export class EmissionsController {
  constructor(
    private readonly emissionsService: EmissionsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async deleteByPrefixKeys(prefix: string): Promise<void> {
    let cursor = '0';

    do {
      const result = await this.redis.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100,
      );
      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Deleted ${keys.length} keys`);
      }
    } while (cursor !== '0');
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  @ApiOperation({
    summary:
      'Retrieve greenhouse gas emissions data for a speciﬁc country and year.',
  })
  @ApiResponse({
    status: 200,
    description: 'Emissions details retrieved successfully',
    type: PaginatedEmissionResponseDto,
  })
  @ApiQuery({
    name: 'country',
    required: false,
    type: String,
    description: 'ISO 3166-1 alpha-3 country code (e.g., "USA")',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year to filter emissions (e.g., 2022)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'The number of results to return per page. Default is 10.',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'The page number to retrieve. Starts from 1. Default is 1.',
    example: 1,
  })
  async getEmissions(
    @Query('country') country?: string,
    @Query('year') year?: number,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedEmissionResponseDto> {
    if (country !== undefined && year !== undefined) {
      return this.emissionsService.findByCountryAndYear(
        country,
        year,
        limit,
        page,
      );
    } else {
      return await this.emissionsService.findAll(limit, page);
    }
  }

  @Get('sector')
  @Roles(Role.Admin, Role.User)
  @ApiOperation({
    summary:
      'Retrieve greenhouse gas emissions by sector for a country and year.',
  })
  @ApiResponse({ status: 200, description: 'Successful response' })
  @ApiQuery({
    name: 'country',
    required: false,
    type: String,
    description: 'ISO 3166-1 alpha-3 country code (e.g., "USA")',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year to filter emissions (e.g., 2022)',
  })
  async getEmissionsBySector(
    @Query('country') country?: string,
    @Query('year') year?: number,
  ): Promise<EmissionBySectorResponseDto> {
    return await this.emissionsService.findBySector(country, year);
  }

  @Get('trend')
  @Roles(Role.Admin, Role.User)
  @ApiOperation({
    summary:
      'Retrieve greenhouse gas emissions trends over time for a country.',
  })
  @ApiQuery({
    name: 'country',
    required: true,
    type: String,
    description: 'ISO 3166-1 alpha-3 country code (e.g., "USA")',
  })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getEmissionTrends(
    @Query('country') country: string,
  ): Promise<EmissionTrendDataResponseDto> {
    const emissionTrends = await this.redis.get(`trend:${country}`);
    if (emissionTrends) {
      return JSON.parse(emissionTrends) as EmissionTrendDataResponseDto;
    }
    const result = await this.emissionsService.getTrendsBySector(country);
    await this.redis.set(`trend:${country}`, JSON.stringify(result));
    return result;
  }

  @Get('filter')
  @Roles(Role.Admin, Role.User)
  @ApiOperation({
    summary: 'Filter emissions by speciﬁc gases (e.g., CO₂, CH₄, N₂O).',
  })
  @ApiResponse({ status: 200, description: 'Successful response' })
  @ApiQuery({
    name: 'gas',
    required: true,
    type: String,
    description: 'Type of gas to filter emissions (e.g., "CO2", "CH4", "CO2E")',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year to filter emissions (e.g., 2022)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'The number of results to return per page. Default is 10.',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'The page number to retrieve. Starts from 1. Default is 1.',
    example: 1,
  })
  async filterEmissions(
    @Query('gas') gas: string,
    @Query('year') year?: number,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedEmissionGasResponseDto> {
    return await this.emissionsService.filterByGas(gas, year, limit, page);
  }

  @Get('summary')
  @Roles(Role.Admin, Role.User)
  @ApiOperation({
    summary:
      ' Retrieve total emissions summary for a year (grouped by country and sector).',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    example: 2014,
    description: 'Year to retrieve emissions summary',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'The number of results to return per page. Default is 10.',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'The page number to retrieve. Starts from 1. Default is 1.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Total emissions summary retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid year format' })
  async getEmissionsSummary(
    @Query('year') year: number,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedEmissionBySummaryResponseDto> {
    if (!year || isNaN(Number(year))) {
      throw new NotFoundException(`Invalid year provided.`);
    }

    return await this.emissionsService.getEmissionsSummary(
      Number(year),
      limit,
      page,
    );
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  @ApiOperation({ summary: 'Retrieve an emission record by ID' })
  @ApiParam({ name: 'id', required: true, example: '65b1234abcde56789f012345' })
  @ApiResponse({
    status: 200,
    description: 'Emission record retrieved successfully',
    type: EmissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Emission record not found' })
  async getEmissionById(@Param('id') id: string): Promise<EmissionResponseDto> {
    const emission = await this.emissionsService.findById(id);
    if (!emission) {
      throw new NotFoundException(`Emission record with ID '${id}' not found`);
    }
    return emission;
  }
  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create new greenhouse gas emissions records.' })
  @ApiResponse({
    status: 201,
    description: 'Emission record created successfully',
  })
  async createEmission(@Body() body: CreateEmissionDto) {
    return this.emissionsService.create(body);
  }

  @Post('bulk')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Add multiple greenhouse gas emission records' })
  @ApiResponse({
    status: 201,
    description: 'Multiple emission records created successfully',
  })
  @ApiBody({ type: [CreateEmissionDto] })
  async createEmissions(@Body() body: CreateEmissionDto[]) {
    this.deleteByPrefixKeys(`trend:`);
    return this.emissionsService.createMany(body);
  }

  @Post('upload-csv')
  @Roles(Role.Admin)
  @Throttle({ default: { limit: 2, ttl: 60 } })
  @ApiOperation({ summary: 'Upload CSV file to insert emissions data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file containing emissions data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV processed and data inserted' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      setImmediate(() => {
        // Process CSV in the background
        this.emissionsService.processCSV(file.buffer);
      });
      this.deleteByPrefixKeys(`trend:`);
      return { message: 'File upload started' }; // Immediate response
    } catch (error) {
      console.error('Error processing CSV:', error);
      throw new BadRequestException(`Error processing file: ${error.message}`);
    }
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update an existing emission record' })
  @ApiResponse({
    status: 200,
    description: 'Emission record updated successfully',
  })
  @ApiBody({
    description: 'Partial update for an emission record',
    required: true,
    schema: {
      type: 'object',
      properties: {
        countryAlpha3: { type: 'string', example: 'USA' },
        sectorSeriesCode: { type: 'string', example: 'EN.CO2.BLDG.ZS' },
        year: { type: 'number', example: 2023 },
        amount: { type: 'number', example: 50000 },
      },
    },
  })
  async updateEmission(
    @Param('id') id: string,
    @Body() body: Partial<CreateEmissionDto>,
  ) {
    const result = await this.emissionsService.update(id, body);
    if (!result) {
      throw new NotFoundException(`Emission record with ID ${id} not found`);
    }
    this.deleteByPrefixKeys(`trend:`);
    return result;
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an emissions record with soft deletion.' })
  @ApiResponse({
    status: 200,
    description: 'Emission record deleted successfully',
  })
  async deleteEmission(@Param('id') id: string) {
    const result = await this.emissionsService.softDelete(id);
    if (!result) {
      throw new NotFoundException(`Emission record with ID ${id} not found`);
    }
    this.deleteByPrefixKeys(`trend:`);
    return result;
  }
}
