import { Injectable } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import { CreateCountryDto } from './dto/create-countries.dto';
import {
  CountryResponseDto,
  PaginatedCountryResponseDto,
} from './dto/country-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CountriesService {
  constructor(private readonly countriesRepository: CountriesRepository) {}

  async findAll(
    limit?: number,
    page?: number,
  ): Promise<PaginatedCountryResponseDto> {
    return await this.countriesRepository.findAll(limit, page);
  }

  async findById(id: string): Promise<CountryResponseDto | null> {
    const country = await this.countriesRepository.findById(id);
    if (!country) return null;
    return plainToInstance(CountryResponseDto, country, {
      excludeExtraneousValues: true,
    });
  }

  async create(data: CreateCountryDto): Promise<CountryResponseDto> {
    const country = await this.countriesRepository.create(data);
    return plainToInstance(CountryResponseDto, country, { excludeExtraneousValues: true });
  }

  async createMany(data: CreateCountryDto[]): Promise<CountryResponseDto[]> {
    const countries = await this.countriesRepository.createMany(data);
    return plainToInstance(CountryResponseDto, countries, {
      excludeExtraneousValues: true,
    });
  }

  async softDelete(id: string): Promise<{ message: string }> {
    await this.countriesRepository.softDelete(id);
    return { message: 'Country soft deleted successfully' };
  }
}
