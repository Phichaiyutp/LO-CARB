import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Country, CountryDocument } from './countries.schema';
import { CreateCountryDto } from './dto/create-countries.dto';
import { plainToInstance } from 'class-transformer';
import {
  CountryResponseDto,
  PaginatedCountryResponseDto,
} from './dto/country-response.dto';

@Injectable()
export class CountriesRepository {
  constructor(
    @InjectModel(Country.name)
    private readonly countryModel: Model<CountryDocument>,
  ) {}
  async findAll(limit: number = 10, page: number = 1) {
    const skip = (page - 1) * limit;
    const totalDocuments = await this.countryModel.countDocuments();
    const countries = await this.countryModel
      .find()
      .select('-deleted')
      .skip(skip)
      .limit(limit)
      .exec();

    const transformedCountries = countries.map((country) =>
      plainToInstance(CountryResponseDto, country, {
        excludeExtraneousValues: true,
      }),
    );

    return plainToInstance(
      PaginatedCountryResponseDto,
      {
        total: totalDocuments,
        limit: Number(limit),
        page: Number(page),
        totalPages: Math.ceil(totalDocuments / limit),
        data: transformedCountries,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findById(id: string): Promise<Country | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid ID format'); // Handle invalid ObjectId
    }

    const country = await this.countryModel
      .findOne({ _id: id, deleted: false })
      .select('-deleted')
      .exec();

    if (!country) {
      throw new NotFoundException('Country not found'); // Better error handling
    }
    return country;
  }

  async create(data: CreateCountryDto) {
    const existingCountry = await this.countryModel
      .findOne({ alpha3: data.alpha3 })
      .exec();
    if (existingCountry) {
      throw new HttpException(
        'Country with this alpha3 code already exists',
        HttpStatus.CONFLICT,
      );
    }
    const newCountry = new this.countryModel(data);
    const savedCountry = await newCountry.save();
    return savedCountry;
  }

  async createMany(data: CreateCountryDto[]): Promise<Country[]> {
    const manyAlpha3 = data.map((country) => country.alpha3);
    const duplicateSeriesCodes = manyAlpha3.filter(
      (code, index, arr) => arr.indexOf(code) !== index,
    );

    if (duplicateSeriesCodes.length > 0) {
      throw new BadRequestException(
        `Duplicate alpha3 in request: ${duplicateSeriesCodes.join(', ')}`,
      );
    }

    const existingCountrys = await this.countryModel.find({
      alpha3: { $in: manyAlpha3 },
    });

    if (existingCountrys.length > 0) {
      const existingCodes = existingCountrys.map((country) => country.alpha3);
      throw new ConflictException(
        `Countrys with alpha3(s) '${existingCodes.join(', ')}' already exist`,
      );
    }

    try {
      return (await this.countryModel.insertMany(data)) as unknown as Country[];
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Duplicate key error: ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new BadRequestException(`Error inserting data: ${error.message}`);
    }
  }

  async softDelete(id: string) {
    const country = await this.countryModel
      .findOne({ _id: id, deleted: false })
      .select('-deleted')
      .exec();
    if (!country) {
      throw new NotFoundException(`Country with id '${id}' not found`);
    }

    if (country.deleted) {
      throw new BadRequestException(
        `Country with id '${id}' is already deleted`,
      );
    }

    return this.countryModel
      .findOneAndUpdate({ _id: id }, { $set: { deleted: true } }, { new: true })
      .exec();
  }
}
