import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Country, CountrySchema } from './countries.schema';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { CountriesRepository } from './countries.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Country.name, schema: CountrySchema }]),
  ],
  controllers: [CountriesController],
  providers: [CountriesService, CountriesRepository],
  exports: [
    MongooseModule.forFeature([{ name: Country.name, schema: CountrySchema }]),
  ],
})
export class CountriesModule {}
