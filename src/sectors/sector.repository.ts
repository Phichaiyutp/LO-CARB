import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { Sector, SectorDocument } from './sectors.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SectorsRepository {
  constructor(
    @InjectModel(Sector.name)
    private readonly sectorModel: Model<SectorDocument>,
  ) {}

  //Create a new sector
  async create(createSectorDto: CreateSectorDto) {
    const existingSector = await this.sectorModel.findOne({ seriesCode: createSectorDto.seriesCode }).exec();
    if (existingSector) {
      throw new BadRequestException(`Sector with seriesCode '${createSectorDto.seriesCode}' already exists`);
    }

    const newSector = new this.sectorModel(createSectorDto);
    return newSector.save();
  }

  //Bulk insert sectors
  async createMany(data: CreateSectorDto[]): Promise<Sector[]> {
    return this.sectorModel.insertMany(data) as unknown as Sector[];
  }

  //Find all sectors (excluding soft-deleted ones)
  async findAll(): Promise<Sector[]> {
    return this.sectorModel.find({ deleted: false }).select('-deleted').exec(); // Exclude soft-deleted sectors
  }

  //Find sector by `seriesCode` (excluding soft-deleted ones)
  async findByCode(seriesCode: string) {
    return this.sectorModel.findOne({ seriesCode, deleted: false }).select('-deleted').exec(); // Exclude soft-deleted sectors
  }

  //Update sector (ensure it's not deleted)
  async update(seriesCode: string, updateSectorDto: Partial<CreateSectorDto>) {
    const updatedSector = await this.sectorModel.findOneAndUpdate(
      { seriesCode, deleted: false }, // Exclude soft-deleted records
      { $set: updateSectorDto },
      { new: true },
    ).select('-deleted').exec();

    if (!updatedSector) {
      throw new NotFoundException(`Sector with seriesCode '${seriesCode}' not found or deleted`);
    }

    return updatedSector;
  }

  //Soft delete a sector
  async softDelete(seriesCode: string) {
    const sector = await this.sectorModel.findOne({ seriesCode }).exec();

    if (!sector) {
      throw new NotFoundException(`Sector with seriesCode '${seriesCode}' not found`);
    }

    if (sector.deleted) {
      throw new BadRequestException(`Sector with seriesCode '${seriesCode}' is already deleted`);
    }

    return this.sectorModel.findOneAndUpdate(
      { seriesCode },
      { $set: { deleted: true } },
      { new: true },
    ).exec();
  }

  //Restore a soft-deleted sector
  async restore(seriesCode: string) {
    const sector = await this.sectorModel.findOne({ seriesCode }).exec();

    if (!sector) {
      throw new NotFoundException(`Sector with seriesCode '${seriesCode}' not found`);
    }

    if (!sector.deleted) {
      throw new BadRequestException(`Sector with seriesCode '${seriesCode}' is not deleted`);
    }

    return this.sectorModel.findOneAndUpdate(
      { seriesCode },
      { $set: { deleted: false } },
      { new: true },
    ).exec();
  }
}
