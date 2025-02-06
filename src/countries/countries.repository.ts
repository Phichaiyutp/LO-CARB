import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country, CountryDocument } from './countries.schema';
import { CreateCountryDto } from './dto/create-countries.dto';

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

    return {
      total: totalDocuments,
      limit: Number(limit),
      page: Number(page),
      totalPages: Math.ceil(totalDocuments / limit),
      data: countries,
    };
  }

  async findByCode(code: string): Promise<Country | null> {
    return this.countryModel.findOne({ code }).select('-deleted').exec();
  }

  async create(data: CreateCountryDto) {
    const existingCountry = await this.countryModel.findOne({ alpha3: data.alpha3 }).exec();
    if (existingCountry) {
      throw new HttpException('Country with this alpha3 code already exists', HttpStatus.CONFLICT);
    }
    const newCountry = new this.countryModel(data);
    const savedCountry = await newCountry.save();
    return {
      data: savedCountry,
    };
  }

  async createMany(data: CreateCountryDto[]): Promise<Country[]> {
    const existingAlpha3Codes = await this.countryModel
      .find({
        alpha3: { $in: data.map((country) => country.alpha3) },
      })
      .exec();

    const existingAlpha3Set = new Set(
      existingAlpha3Codes.map((country) => country.alpha3),
    );

    const filteredData = data.filter(
      (country) => !existingAlpha3Set.has(country.alpha3),
    );

    return this.countryModel.insertMany(filteredData) as unknown as Country[];
  }
  async softDelete(id: string): Promise<any> {
    return this.countryModel.findByIdAndDelete(id).exec();
  }
}
