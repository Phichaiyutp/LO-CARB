import { Injectable } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorsRepository } from './sector.repository';
import { worldbankSeriesCode } from './constants';
import { plainToInstance } from 'class-transformer';
import { SectorResponseDto } from './dto/sector-response.dto';

@Injectable()
export class SectorService {
  constructor(private readonly sectorsRepository: SectorsRepository) {}

  async findAll(): Promise<SectorResponseDto[]> {
    const sectors = await this.sectorsRepository.findAll();
    return plainToInstance(SectorResponseDto, sectors, { excludeExtraneousValues: true });
  }

  async findById(id: string): Promise<SectorResponseDto | null> {
    const sector = await this.sectorsRepository.findById(id);
    if (!sector) return null;
    return plainToInstance(SectorResponseDto, sector, { excludeExtraneousValues: true });
  }

  async findByCode(code: string): Promise<SectorResponseDto | null> {
    const sector = await this.sectorsRepository.findByCode(code);
    if (!sector) return null;
    return plainToInstance(SectorResponseDto, sector, { excludeExtraneousValues: true });
  }

  async create(createSectorDto: CreateSectorDto): Promise<SectorResponseDto> {
    const worldbankData = worldbankSeriesCode[createSectorDto.seriesCode] ?? {};
    const enrichedDto = {
      ...createSectorDto,
      industry: worldbankData.industry ?? createSectorDto.industry,
      gasType: worldbankData.gasType ?? createSectorDto.gasType,
      unit: worldbankData.unit ?? createSectorDto.unit
    };
  
    const sector = await this.sectorsRepository.create(enrichedDto);
    return plainToInstance(SectorResponseDto, sector, { excludeExtraneousValues: true });
  }
  
  

  async createMany(createSectorDtos: CreateSectorDto[]): Promise<SectorResponseDto[]> {
    const enrichedDtos = createSectorDtos.map((dto) => ({
      ...dto,
      ...(worldbankSeriesCode[dto.seriesCode] || null),
    }));
    const sectors = await this.sectorsRepository.createMany(enrichedDtos);
    return plainToInstance(SectorResponseDto, sectors, { excludeExtraneousValues: true });
  }

  async softDelete(id: string): Promise<{ message: string }> {
    await this.sectorsRepository.softDelete(id);
    return { message: 'Sector soft deleted successfully' };
  }
}
