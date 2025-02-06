import { Injectable } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import { CreateCountryDto } from './dto/create-countries.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly countriesRepository: CountriesRepository) {}

  async findAll(limit?: number, page?: number) {
    return this.countriesRepository.findAll(limit,page);
  }

  async findByCode(code: string) {
    return this.countriesRepository.findByCode(code);
  }

  async create(data: CreateCountryDto) {
    return this.countriesRepository.create(data);
  }
  async createMany(data: CreateCountryDto[]) {
    return this.countriesRepository.createMany(data);
  }
  async softDelete(id: string) {
    return this.countriesRepository.softDelete(id);
  }
}
