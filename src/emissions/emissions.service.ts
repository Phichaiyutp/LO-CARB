import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmissionsRepository } from './emissions.repository';
import { CreateEmissionDto } from './dto/create-emissions.dto';
import { Types } from 'mongoose';
import { Emission } from './emissions.schema';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class EmissionsService {
  constructor(
    private readonly emissionsRepository: EmissionsRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async getCache<T = unknown>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }
  async setCache(key: string, value: any, seconds = 600): Promise<void> {
    await this.cacheManager.set(key, value, seconds);
  }

  async delCache(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async findById(id: string) {
    return this.emissionsRepository.findById(id);
  }

  async findAll(limit?: number, page?: number) {
    return this.emissionsRepository.findAll(limit, page);
  }

  async findByCountryAndYear(
    countryAlpha3: string,
    year: number,
    limit?: number,
    page?: number,
  ) {
    const country = await this.validateCountry(countryAlpha3);
    if (!country) {
      throw new NotFoundException(
        `Country with alpha3 code '${countryAlpha3}' not found`,
      );
    }

    return this.emissionsRepository.findByCountryAndYear(
      country._id as Types.ObjectId,
      year,
      limit,
      page,
    );
  }

  async findBySector(countryAlpha3?: string, year?: number) {
    return this.emissionsRepository.findBySector(countryAlpha3, year);
  }

  async getTrendsBySector(countryAlpha3: string) {
    const cacheKey = `trends:${countryAlpha3}`;
    const cachedData = await this.getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const trends =
      await this.emissionsRepository.getTrendsBySector(countryAlpha3);
    await this.setCache(cacheKey, trends, 600);
    return trends;
  }

  async filterByGas(
    gasType: string,
    year?: number,
    limit?: number,
    page?: number,
  ) {
    return this.emissionsRepository.filterByGas(gasType, year, limit, page);
  }
  async getEmissionsSummary(year: number) {
    return this.emissionsRepository.getEmissionsSummary(year);
  }

  async create(data: CreateEmissionDto) {
    if (!data.countryAlpha3 || !data.sectorSeriesCode || !data.year) {
      throw new BadRequestException(
        'Missing required fields: countryAlpha3, sectorSeriesCode, year',
      );
    }
    const result = this.emissionsRepository.create(data);
    await this.delCache(`trends:${data.countryAlpha3}`);
    return result;
  }

  async createMany(data: CreateEmissionDto[]): Promise<Emission[]> {
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
        await this.delCache(`trends:${entry.countryAlpha3}`);
        validatedData.push({
          countryId: country._id as Types.ObjectId,
          sectorId: sector._id as Types.ObjectId,
          year: entry.year,
          amount: entry.amount,
        } as Emission);
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

    const results = this.emissionsRepository.createMany(validatedData);

    return results;
  }

  async validateCountry(countryAlpha3: string) {
    return this.emissionsRepository.findCountryByAlpha3(countryAlpha3) ?? null;
  }

  async validateSector(seriesCode: string) {
    return this.emissionsRepository.findSectorBySeriesCode(seriesCode) ?? null;
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

  //Soft delete emission record
  async softDelete(id: string) {
    const deletedEmission = await this.emissionsRepository.softDelete(id);
    if (!deletedEmission) {
      throw new NotFoundException(`Emission record with ID '${id}' not found.`);
    }
    return { message: `Emission record ${id} successfully soft deleted.` };
  }

  //Restore soft-deleted emission record
  async restore(id: string) {
    const restoredEmission = await this.emissionsRepository.restore(id);
    if (!restoredEmission) {
      throw new NotFoundException(
        `Emission record with ID '${id}' not found or not deleted.`,
      );
    }
    return { message: `Emission record ${id} successfully restored.` };
  }

  async update(id: string, data: Partial<CreateEmissionDto>) {
    return this.emissionsRepository.update(id, data);
  }
}
