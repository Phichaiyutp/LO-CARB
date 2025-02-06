import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-countries.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all countries' })
  @ApiResponse({ status: 200, description: 'Successful response' })
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
  ) {
    return this.countriesService.findAll(limit,page);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Retrieve a country by its code' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getCountryByCode(@Param('code') code: string) {
    return this.countriesService.findByCode(code);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new country' })
  @ApiResponse({ status: 201, description: 'Country created successfully' })
  async createCountry(@Body() body: CreateCountryDto) {
    return this.countriesService.create(body);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Add multiple greenhouse gas emission records' })
  @ApiResponse({
    status: 201,
    description: 'Multiple emission records created successfully',
  })
  @ApiBody({ type: [CreateCountryDto] })
  async createCountries(@Body() body: CreateCountryDto[]) {
    return this.countriesService.createMany(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a country by its ID' })
  @ApiResponse({ status: 200, description: 'Country deleted successfully' })
  async deleteCountry(@Param('id') id: string) {
    return this.countriesService.softDelete(id);
  }
}
