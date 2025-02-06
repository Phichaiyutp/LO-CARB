import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Emission, EmissionSchema } from './emissions.schema';
import { EmissionsService } from './emissions.service';
import { EmissionsController } from './emissions.controller';
import { EmissionsRepository } from './emissions.repository';
import { CountriesModule } from 'src/countries/countries.module';
import { SectorModule } from 'src/sectors/sector.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Emission.name, schema: EmissionSchema }]),
    CountriesModule,
    SectorModule,
    CacheModule.register(),
  ],
  controllers: [EmissionsController],
  providers: [EmissionsService, EmissionsRepository],
  exports: [EmissionsRepository],
})
export class EmissionsModule {}
