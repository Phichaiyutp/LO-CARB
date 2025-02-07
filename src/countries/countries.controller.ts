import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-countries.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CountryResponseDto, PaginatedCountryResponseDto } from './dto/country-response.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Countries')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @Roles(Role.Admin,Role.User)
  @ApiOperation({ summary: 'Retrieve all countries (Paginated)' })
  @ApiResponse({ status: 200, description: 'Successful response', type: PaginatedCountryResponseDto })
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
  async getCountries(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedCountryResponseDto> {
    return this.countriesService.findAll(limit, page);
  }

  @Get(':id')
  @Roles(Role.Admin,Role.User)
  @ApiOperation({ summary: 'Retrieve a country by its id' })
  @ApiResponse({ status: 200, description: 'Successful response', type: CountryResponseDto })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'id', required: true, description: 'The country id' })
  async getCountryById(@Param('id') id: string): Promise<CountryResponseDto | null> {
    return this.countriesService.findById(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Add a new country' })
  @ApiResponse({ status: 201, description: 'Country created successfully', type: CountryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data format' })
  @ApiResponse({ status: 409, description: 'Country with this alpha3 code already exists' })
  async createCountry(@Body() body: CreateCountryDto): Promise<CountryResponseDto> {
    return this.countriesService.create(body);
  }

  @Post('bulk')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Add multiple countries' })
  @ApiResponse({ status: 201, description: 'Countries created successfully', type: [CountryResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid data format' })
  @ApiBody({ type: [CreateCountryDto] })
  async createCountries(@Body() body: CreateCountryDto[]): Promise<CountryResponseDto[]> {
    return this.countriesService.createMany(body);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a country by its ID' })
  @ApiResponse({ status: 200, description: 'Country deleted successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiParam({ name: 'id', required: true, description: 'The ID of the country to delete' })
  async deleteCountry(@Param('id') id: string): Promise<{ message: string }> {
    return this.countriesService.softDelete(id);
  }
}
