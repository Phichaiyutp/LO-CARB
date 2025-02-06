import { Injectable } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorsRepository } from './sector.repository';
import { worldbankSeriesCode } from './constants';

@Injectable()
export class SectorService {
  constructor(private readonly sectorsRepository: SectorsRepository) {}

  async findAll() {
    return this.sectorsRepository.findAll();
  }

  async findByCode(code: string) {
    return this.sectorsRepository.findByCode(code);
  }

  async create(createSectorDto: CreateSectorDto) {
    const enrichedDto = {
      ...createSectorDto,
      ...(worldbankSeriesCode[createSectorDto.seriesCode] || null),
    };
    return this.sectorsRepository.create(enrichedDto);
  }

  async createMany(createSectorDtos: CreateSectorDto[]) {
    const enrichedDtos = createSectorDtos.map((dto) => ({
      ...dto,
      ...(worldbankSeriesCode[dto.seriesCode] || null),
    }));
    return this.sectorsRepository.createMany(enrichedDtos);
  }

  async softDelete(id: string) {
    return this.sectorsRepository.softDelete(id);
  }
}
