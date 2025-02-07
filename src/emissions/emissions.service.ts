import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmissionsRepository } from './emissions.repository';
import { CreateEmissionDto } from './dto/create-emissions.dto';
import { Types } from 'mongoose';
import { Emission } from './emissions.schema';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import { plainToInstance } from 'class-transformer';
import {
  PaginatedEmissionResponseDto,
  EmissionResponseDto,
  EmissionBySectorResponseDto,
  PaginatedEmissionBySummaryResponseDto,
  EmissionTrendDataResponseDto,
  PaginatedEmissionGasResponseDto,
} from './dto/emission-response.dto';

@Injectable()
export class EmissionsService {
  constructor(private readonly emissionsRepository: EmissionsRepository) {}

  async validateCountry(countryAlpha3: string) {
    return this.emissionsRepository.findCountryByAlpha3(countryAlpha3) ?? null;
  }

  async validateSector(seriesCode: string) {
    return this.emissionsRepository.findSectorBySeriesCode(seriesCode) ?? null;
  }
  async findByCountryAndYear(
    countryAlpha3: string,
    year: number,
    limit?: number,
    page?: number,
  ): Promise<PaginatedEmissionResponseDto> {
    const country = await this.validateCountry(countryAlpha3);
    if (!country) {
      throw new NotFoundException(
        `Country with alpha3 code '${countryAlpha3}' not found`,
      );
    }

    return await this.emissionsRepository.findByCountryAndYear(
      country._id as Types.ObjectId,
      year,
      limit,
      page,
    );
  }

  async findAll(
    limit?: number,
    page?: number,
  ): Promise<PaginatedEmissionResponseDto> {
    const result = await this.emissionsRepository.findAll(limit, page);
    return {
      ts: result.ts,
      total: result.total,
      limit: result.limit,
      page: result.page,
      totalPages: result.totalPages,
      data: plainToInstance(EmissionResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findById(id: string): Promise<EmissionResponseDto> {
    const emission = await this.emissionsRepository.findById(id);
    if (!emission) {
      throw new NotFoundException(`Emission record with ID '${id}' not found.`);
    }
    return plainToInstance(EmissionResponseDto, emission, {
      excludeExtraneousValues: true,
    });
  }

  async findBySector(
    countryAlpha3?: string,
    year?: number,
  ): Promise<EmissionBySectorResponseDto> {
    return this.emissionsRepository.findBySector(countryAlpha3, year);
  }

  async getTrendsBySector(countryAlpha3: string) :Promise<EmissionTrendDataResponseDto>  {
    return await this.emissionsRepository.getTrendsBySector(countryAlpha3);
  }

  async filterByGas(
    gasType: string,
    year?: number,
    limit?: number,
    page?: number,
  ):Promise<PaginatedEmissionGasResponseDto>  {
    return this.emissionsRepository.filterByGas(gasType, year, limit, page);
  }

  async getEmissionsSummary(
    year: number,
    limit?: number,
    page?: number,
  ): Promise<PaginatedEmissionBySummaryResponseDto> {
    return this.emissionsRepository.getEmissionsSummary(year, limit, page);
  }

  async create(data: CreateEmissionDto): Promise<EmissionResponseDto> {
    if (!data.countryAlpha3 || !data.sectorSeriesCode || !data.year) {
      throw new BadRequestException(
        'Missing required fields: countryAlpha3, sectorSeriesCode, year',
      );
    }
    const emission = await this.emissionsRepository.create(data);
    return plainToInstance(EmissionResponseDto, emission, {
      excludeExtraneousValues: true,
    });
  }

  async createMany(data: CreateEmissionDto[]): Promise<EmissionResponseDto[]> {
    const validatedData: Emission[] = [];

    for (const entry of data) {
      try {
        const country = await this.validateCountry(entry.countryAlpha3);
        const sector = await this.validateSector(entry.sectorSeriesCode);

        if (!country || !sector) {
          console.warn(
            `Skipping entry: Invalid country (${entry.countryAlpha3}) or sector (${entry.sectorSeriesCode})`,
          );
          continue;
        }

        validatedData.push(
          plainToInstance(Emission, {
            countryId: country._id as Types.ObjectId,
            sectorId: sector._id as Types.ObjectId,
            year: entry.year,
            amount: entry.amount,
          }),
        );
      } catch (error) {
        console.error(
          `Error validating entry: ${JSON.stringify(entry)}`,
          error,
        );
      }
    }

    if (validatedData.length === 0) {
      throw new BadRequestException('No valid data found for insertion.');
    }

    const results = await this.emissionsRepository.createMany(validatedData);
    return plainToInstance(EmissionResponseDto, results, {
      excludeExtraneousValues: true,
    });
  }

  async processCSV(fileBuffer: Buffer): Promise<Emission[]> {
    const results: Emission[] = [];
    const requiredHeaders = ['Country Code', 'Series Code'];

    return new Promise((resolve, reject) => {
      let isHeaderRow = false;
      let processingPromises: Promise<void>[] = [];

      const stream = Readable.from(fileBuffer.toString());

      stream
        .pipe(csvParser())
        .on('headers', (headers) => {
          if (!requiredHeaders.every((h) => headers.includes(h))) {
            console.warn(`Skipping metadata row: ${headers.join(', ')}`);
            return reject(
              new BadRequestException(
                'Invalid CSV format: Missing required headers.',
              ),
            );
          }
          isHeaderRow = true;
        })
        .on('data', (data) => {
          if (!isHeaderRow) {
            console.warn(`Skipping metadata row: ${JSON.stringify(data)}`);
            return;
          }

          processingPromises.push(
            (async () => {
              try {
                const countryCode = data['Country Code'];
                const seriesCode = data['Series Code'];
                const yearsData = { ...data };

                if (!countryCode || !seriesCode) {
                  console.error(
                    `Skipping row due to missing country or sector code`,
                  );
                  return;
                }

                const country = await this.validateCountry(countryCode);
                const sector = await this.validateSector(seriesCode);
                if (!country || !sector) {
                  console.error(
                    `Skipping row: Country '${countryCode}' or Sector '${seriesCode}' not found.`,
                  );
                  return;
                }

                for (const [yearLabel, amount] of Object.entries(yearsData)) {
                  const yearMatch = /\d{4}/.exec(yearLabel);
                  if (!yearMatch) continue;

                  const year = parseInt(yearMatch[0]);
                  const parsedAmount = parseFloat(amount as string);
                  if (isNaN(parsedAmount)) continue;

                  results.push({
                    countryId: country._id as Types.ObjectId,
                    sectorId: sector._id as Types.ObjectId,
                    year,
                    amount: parsedAmount,
                  });
                }
              } catch (error) {
                console.error(
                  `Error processing row: ${JSON.stringify(data)}`,
                  error,
                );
              }
            })(),
          );
        })
        .on('error', (error) => {
          console.error('CSV Processing Error:', error);
          reject(
            new BadRequestException(`Error processing file: ${error.message}`),
          );
        })
        .on('end', async () => {
          await Promise.all(processingPromises);
          if (results.length === 0) {
            console.warn('No valid data found in CSV.');
            return reject(
              new BadRequestException('No valid data found in CSV.'),
            );
          }

          try {
            const insertedRecords =
              await this.emissionsRepository.createMany(results);
            resolve(insertedRecords);
          } catch (error) {
            console.error('Database Insert Error:', error);
            reject(
              new BadRequestException(`Error inserting data: ${error.message}`),
            );
          }
        });
    });
  }

  async update(
    id: string,
    data: Partial<CreateEmissionDto>,
  ): Promise<EmissionResponseDto> {
    const updatedEmission = await this.emissionsRepository.update(id, data);
    if (!updatedEmission) {
      throw new NotFoundException(`Emission record with ID '${id}' not found.`);
    }
    return plainToInstance(EmissionResponseDto, updatedEmission, {
      excludeExtraneousValues: true,
    });
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const deletedEmission = await this.emissionsRepository.softDelete(id);
    if (!deletedEmission) {
      throw new NotFoundException(`Emission record with ID '${id}' not found.`);
    }
    return { message: `Emission record ${id} successfully soft deleted.` };
  }
}
