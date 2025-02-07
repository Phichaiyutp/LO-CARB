import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Emission, EmissionDocument } from './emissions.schema';
import { CreateEmissionDto } from './dto/create-emissions.dto';
import { Country, CountryDocument } from 'src/countries/countries.schema';
import { Sector, SectorDocument } from 'src/sectors/sectors.schema';
import { gasTypeMapping } from './constants';
import { plainToInstance } from 'class-transformer';
import {
  EmissionBySectorDataDto,
  EmissionBySectorResponseDto,
  EmissionBySummaryDataDto,
  EmissionGasRecordDto,
  EmissionResponseDto,
  EmissionTrendDataResponseDto,
  PaginatedEmissionBySummaryResponseDto,
  PaginatedEmissionGasResponseDto,
  PaginatedEmissionResponseDto,
} from './dto/emission-response.dto';
import {
  EmissionBySector,
  EmissionSummary,
} from './interface/emission-documents.interface';
import { CountryResponseDto } from 'src/countries/dto/country-response.dto';

@Injectable()
export class EmissionsRepository {
  constructor(
    @InjectModel(Emission.name)
    private readonly emissionModel: Model<EmissionDocument>,
    @InjectModel(Country.name)
    private readonly countryModel: Model<CountryDocument>,
    @InjectModel(Sector.name)
    private readonly sectorModel: Model<SectorDocument>,
  ) {}

  async findCountryByAlpha3(alpha3: string) {
    return this.countryModel.findOne({ alpha3, deleted: false }).exec();
  }

  async findSectorBySeriesCode(seriesCode: string) {
    return this.sectorModel.findOne({ seriesCode, deleted: false }).exec();
  }
  async create(data: CreateEmissionDto): Promise<Emission> {
    const country = await this.findCountryByAlpha3(data.countryAlpha3);
    const sector = await this.findSectorBySeriesCode(data.sectorSeriesCode);

    if (!country || !sector) {
      throw new NotFoundException('Country or Sector not found');
    }

    const existingEmission = await this.emissionModel
      .findOne({
        countryId: country._id,
        sectorId: sector._id,
        year: data.year,
        deleted: false,
      })
      .exec();

    if (existingEmission) {
      throw new HttpException(
        `Emission record already exists for ${data.countryAlpha3}, ${data.sectorSeriesCode}, ${data.year}`,
        HttpStatus.CONFLICT,
      );
    }

    const newEmission = new this.emissionModel({
      year: data.year,
      amount: data.amount,
      countryId: country._id as Types.ObjectId,
      sectorId: sector._id as Types.ObjectId,
      deleted: false,
    });
    return newEmission.save();
  }

  async createMany(data: Emission[]) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Invalid data format or empty array.');
    }

    const existingRecords = await this.emissionModel
      .find({
        $or: data.map(({ countryId, sectorId, year }) => ({
          countryId,
          sectorId,
          year,
          deleted: false,
        })),
      })
      .select('_id countryId sectorId year');

    const existingSet = new Set(
      existingRecords.map(
        ({ countryId, sectorId, year }) => `${countryId}-${sectorId}-${year}`,
      ),
    );

    // Filter only new emissions that do not exist
    const newEntries = data.filter(({ countryId, sectorId, year }) => {
      return !existingSet.has(`${countryId}-${sectorId}-${year}`);
    });

    if (newEntries.length === 0) {
      throw new BadRequestException('All emissions already exist.');
    }

    return await this.emissionModel.insertMany(newEntries);
  }

  async getTrendsBySector(
    countryAlpha3: string,
  ): Promise<EmissionTrendDataResponseDto> {
    const country = await this.findCountryByAlpha3(countryAlpha3);
    if (!country) {
      throw new NotFoundException(`Country '${countryAlpha3}' not found`);
    }

    const aggregationPipeline: PipelineStage[] = [
      { $match: { countryId: country._id, deleted: false } },
      {
        $group: {
          _id: '$year',
          totalEmissions: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id',
          totalEmissions: 1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [],
        },
      },
    ];

    const result = await this.emissionModel
      .aggregate(aggregationPipeline)
      .exec();

    return {
      ts: new Date().toISOString(),
      country: plainToInstance(CountryResponseDto, country, {
        excludeExtraneousValues: true,
      }),
      filter: { countryAlpha3 },
      totalRecords: result[0]?.metadata[0]?.total || 0,
      data: result[0]?.data || [],
    };
  }

  async filterByGas(
    gasType: string,
    year?: number,
    limit: number = 10,
    page: number = 1,
  ):Promise<PaginatedEmissionGasResponseDto> {
    const skip = (page - 1) * limit;

    // Validate and normalize gas type
    const normalizedGasType = gasTypeMapping[gasType] ?? gasType;
    if (!Object.values(gasTypeMapping).includes(normalizedGasType)) {
      throw new BadRequestException(`Invalid gas type: ${gasType}`);
    }

    let filter: any = { deleted: false };
    if (year) {
      filter.year = Number(year);
    }

    const aggregationPipeline = [
      { $match: { ...filter, deleted: false } },
      {
        $lookup: {
          from: 'sectors',
          localField: 'sectorId',
          foreignField: '_id',
          as: 'sector',
        },
      },
      { $unwind: { path: '$sector', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'sector.gasType': normalizedGasType,
        },
      },
      {
        $lookup: {
          from: 'countries',
          localField: 'countryId',
          foreignField: '_id',
          as: 'country',
        },
      },
      { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
      { $skip: skip },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 0,
          year: 1,
          amount: 1,
          'country.name': 1,
          'country.alpha3': 1,
          'sector.name': 1,
          'sector.industry': 1,
          'sector.seriesCode': 1,
          'sector.gasType': 1,
        },
      },
    ];

    const emissions = await this.emissionModel
      .aggregate(aggregationPipeline)
      .exec();
    const totalDocuments = await this.emissionModel.countDocuments(filter);

    return {
      ts: new Date().toISOString(),
      gasType: normalizedGasType,
      filter:{year,gasType},
      total: totalDocuments,
      limit: Number(limit),
      page: Number(page),
      totalPages: Math.ceil(totalDocuments / limit),
      data: plainToInstance(EmissionGasRecordDto, emissions, {
        excludeExtraneousValues: true,
      })
    };
  }
  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid ID format'); // Handle invalid ObjectId
    }

    const emission = await this.emissionModel
      .findOne({ _id: new Types.ObjectId(id), deleted: false }) // Convert id to ObjectId
      .select('-deleted')
      .populate('countryId', 'name alpha3')
      .populate('sectorId', 'industry gasType unit seriesName seriesCode')
      .exec();

    if (!emission) {
      throw new NotFoundException('Emission not found'); // Better error handling
    }

    return {
      _id: String(emission._id),
      year: emission.year,
      amount: emission.amount,
      createdAt: emission.createdAt,
      updatedAt: emission.updatedAt,
      country: emission.countryId,
      sector: emission.sectorId,
    };
  }

  async findOne(
    countryAlpha3: string,
    year: number,
    sectorSeriesCode: string,
  ): Promise<Emission | null> {
    const country = await this.findCountryByAlpha3(countryAlpha3);
    const sector = await this.findSectorBySeriesCode(sectorSeriesCode);

    if (!country || !sector) {
      throw new NotFoundException('Country or Sector not found');
    }

    return this.emissionModel
      .findOne({
        countryId: country._id,
        sectorId: sector._id,
        year,
        deleted: false,
      })
      .select('-deleted')
      .populate('countryId', 'name alpha3')
      .populate('sectorId', 'industry gasType unit seriesName seriesCode')
      .exec();
  }

  async findAll(limit: number = 10, page: number = 1) {
    const skip = (page - 1) * limit;
    const totalDocuments = await this.emissionModel.countDocuments({
      deleted: false,
    });

    const emissions = await this.emissionModel
      .find({ deleted: false })
      .select('-deleted')
      .populate('countryId', 'name alpha3')
      .populate('sectorId', 'name industry gasType unit seriesName seriesCode')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const transformedEmissions = emissions.map((emission) => ({
      _id: String(emission._id), // Keep the original ObjectId
      year: emission.year,
      amount: emission.amount,
      createdAt: emission.createdAt,
      updatedAt: emission.updatedAt,
      country: emission.countryId, // Rename countryId → country
      sector: emission.sectorId, // Rename sectorId → sector
      countryId: undefined,
      sectorId: undefined,
    }));

    return {
      ts: new Date().toISOString(),
      total: totalDocuments,
      limit,
      page,
      totalPages: Math.ceil(totalDocuments / limit),
      data: transformedEmissions,
    };
  }

  async findByCountryAndYear(
    countryId?: Types.ObjectId,
    year?: number,
    limit: number = 10,
    page: number = 1,
  ): Promise<PaginatedEmissionResponseDto> {
    const skip = (page - 1) * limit;
    const filter: any = { deleted: false };

    if (countryId) {
      filter.countryId = countryId;
    }
    if (year) {
      filter.year = Number(year);
    }

    const totalDocuments = await this.emissionModel.countDocuments(filter);

    const emissions = await this.emissionModel
      .find(filter)
      .select('-deleted')
      .populate('countryId', 'name alpha3')
      .populate('sectorId', 'name industry gasType unit seriesName seriesCode')
      .skip(skip)
      .limit(limit)
      .lean() // Optimize performance by returning plain objects
      .exec();

    // Rename fields properly
    const transformedEmissions = emissions.map((emission) => ({
      _id: String(emission._id), // Keep the original ObjectId
      year: emission.year,
      amount: emission.amount,
      createdAt: emission.createdAt,
      updatedAt: emission.updatedAt,
      country: emission.countryId, // Rename countryId → country
      sector: emission.sectorId, // Rename sectorId → sector
      countryId: undefined,
      sectorId: undefined,
    }));

    return {
      ts: new Date().toISOString(),
      filter: { year: Number(year), countryId },
      total: totalDocuments,
      limit,
      page,
      totalPages: Math.ceil(totalDocuments / limit),
      data: plainToInstance(EmissionResponseDto, transformedEmissions, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async findBySector(
    countryAlpha3?: string,
    year?: number,
  ): Promise<EmissionBySectorResponseDto> {
    let filter: any = {};

    if (countryAlpha3) {
      const country = await this.findCountryByAlpha3(countryAlpha3);
      if (!country) {
        throw new NotFoundException(`Country '${countryAlpha3}' not found`);
      }
      filter.countryId = country._id;
    }

    if (year) {
      filter.year = Number(year);
    }

    const aggregationPipeline: PipelineStage[] = [
      { $match: { ...filter, deleted: false } },
      {
        $group: {
          _id: '$sectorId',
          totalEmissions: { $sum: '$amount' },
          year: { $first: '$year' },
          countryId: { $first: '$countryId' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'sectors',
          localField: '_id',
          foreignField: '_id',
          as: 'sector',
        },
      },
      { $unwind: { path: '$sector', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'countries',
          localField: 'countryId',
          foreignField: '_id',
          as: 'country',
        },
      },
      { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          sectorId: '$_id',
          'country.name': 1,
          'country.alpha3': 1,
          'sector.name': '$sector.name',
          'sector.industry': '$sector.industry',
          'sector.seriesCode': '$sector.seriesCode',
          'sector.gasType': '$sector.gasType',
          'sector.unit': '$sector.unit',
          year: 1,
          totalEmissions: 1,
          count: 1,
        },
      },
    ];

    const groupedEmissions: EmissionBySector[] = await this.emissionModel
      .aggregate(aggregationPipeline)
      .exec();

    const transformedEmissions = groupedEmissions.map((groupedEmission) => ({
      totalEmissions: groupedEmission.totalEmissions,
      year: groupedEmission.year,
      count: groupedEmission.count,
      sector: groupedEmission.sector,
      country: groupedEmission.country,
    }));

    return {
      ts: new Date().toISOString(),
      filter,
      data: plainToInstance(EmissionBySectorDataDto, transformedEmissions, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async getEmissionsSummary(
    year: number,
    limit: number = 10,
    page: number = 1,
  ): Promise<PaginatedEmissionBySummaryResponseDto> {
    const skip = (page - 1) * limit;

    const aggregationPipeline: PipelineStage[] = [
      { $match: { year: Number(year), deleted: false } },

      {
        $group: {
          _id: {
            countryId: '$countryId',
            sectorId: '$sectorId',
          },
          totalEmissions: { $sum: '$amount' },
        },
      },

      {
        $lookup: {
          from: 'countries',
          localField: '_id.countryId',
          foreignField: '_id',
          as: 'country',
        },
      },
      { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'sectors',
          localField: '_id.sectorId',
          foreignField: '_id',
          as: 'sector',
        },
      },
      { $unwind: { path: '$sector', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          'country.name': 1,
          'country.alpha3': 1,
          'sector.name': '$sector.name',
          'sector.industry': '$sector.industry',
          'sector.seriesCode': '$sector.seriesCode',
          'sector.gasType': '$sector.gasType',
          'sector.unit': '$sector.unit',
          totalEmissions: 1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { country: 1, sector: 1 } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
    ];
    const results: EmissionSummary[] = await this.emissionModel
      .aggregate(aggregationPipeline)
      .exec();
    const result = results[0];
    const totalDocuments = result.metadata.total ?? 0;

    const groupedEmissions = result.data;
    const transformedEmissions = groupedEmissions.map((data) => ({
      totalEmissions: data.totalEmissions,
      sector: data.sector,
      country: data.country,
    }));

    return {
      ts: new Date().toISOString(),
      filter: { year },
      total: totalDocuments,
      limit,
      page,
      totalPages: Math.ceil(totalDocuments / limit),
      data: plainToInstance(EmissionBySummaryDataDto, transformedEmissions, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async update(
    id: string,
    data: Partial<CreateEmissionDto>,
  ): Promise<Emission> {
    if (!Object.keys(data).length) {
      throw new BadRequestException('No update data provided.');
    }

    const updatedEmission = await this.emissionModel
      .findOneAndUpdate({ _id: id, deleted: false }, data, { new: true })
      .select('-deleted')
      .exec();

    if (!updatedEmission) {
      throw new NotFoundException('Emission record not found');
    }

    return updatedEmission;
  }

  async softDelete(id: string) {
    const emission = await this.emissionModel
      .findOne({ _id: id, deleted: false })
      .select('-deleted')
      .exec();
    if (!emission) {
      throw new NotFoundException(`Emission with id '${id}' not found`);
    }

    if (emission.deleted) {
      throw new BadRequestException(
        `Emission with id '${id}' is already deleted`,
      );
    }

    return this.emissionModel
      .findOneAndUpdate({ _id: id }, { $set: { deleted: true } }, { new: true })
      .exec();
  }
}
