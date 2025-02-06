import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sector, SectorSchema } from './sectors.schema';
import { SectorController } from './sector.controller';
import { SectorService } from './sector.service';
import { SectorsRepository } from './sector.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sector.name, schema: SectorSchema }])],
  controllers: [SectorController],
  providers: [SectorService,SectorsRepository],
  exports: [
    MongooseModule.forFeature([{ name: Sector.name, schema: SectorSchema }]),
  ],
})
export class SectorModule {}
