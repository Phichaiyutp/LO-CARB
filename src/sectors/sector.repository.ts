import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { Sector, SectorDocument } from './sectors.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class SectorsRepository {
  constructor(
    @InjectModel(Sector.name)
    private readonly sectorModel: Model<SectorDocument>,
  ) {}

  //Create a new sector
  async create(createSectorDto: CreateSectorDto) {
    const existingSector = await this.sectorModel
      .findOne({ seriesCode: createSectorDto.seriesCode })
      .exec();

    if (existingSector) {
      throw new ConflictException(
        `Sector with seriesCode '${createSectorDto.seriesCode}' already exists`,
      );
    }

    const newSector = new this.sectorModel(createSectorDto);
    return await newSector.save();
  }

  //Bulk insert sectors
  async createMany(data: CreateSectorDto[]): Promise<Sector[]> {
    const seriesCodes = data.map((sector) => sector.seriesCode);
    const duplicateSeriesCodes = seriesCodes.filter(
      (code, index, arr) => arr.indexOf(code) !== index,
    );

    if (duplicateSeriesCodes.length > 0) {
      throw new BadRequestException(
        `Duplicate seriesCode in request: ${duplicateSeriesCodes.join(', ')}`,
      );
    }

    const existingSectors = await this.sectorModel.find({
      seriesCode: { $in: seriesCodes },
    });

    if (existingSectors.length > 0) {
      const existingCodes = existingSectors.map((sector) => sector.seriesCode);
      throw new ConflictException(
        `Sectors with seriesCode(s) '${existingCodes.join(', ')}' already exist`,
      );
    }

    try {
      return (await this.sectorModel.insertMany(data)) as unknown as Sector[];
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Duplicate key error: ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new BadRequestException(`Error inserting data: ${error.message}`);
    }
  }

  //Find all sectors (excluding soft-deleted ones)
  async findAll(): Promise<Sector[]> {
    return this.sectorModel.find({ deleted: false }).select('-deleted').exec(); // Exclude soft-deleted sectors
  }
  async findById(id: string): Promise<Sector> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid ID format'); // Handle invalid ObjectId
    }

    const sector = await this.sectorModel
      .findOne({ _id: id, deleted: false })
      .select('-deleted')
      .exec(); // Exclude soft-deleted sectors

    if (!sector) {
      throw new NotFoundException('Sector not found'); // Better error handling
    }
    return sector;
  }
  //Find sector by `seriesCode` (excluding soft-deleted ones)
  async findByCode(seriesCode: string) {
    return this.sectorModel
      .findOne({ seriesCode, deleted: false })
      .select('-deleted')
      .exec(); // Exclude soft-deleted sectors
  }

  //Update sector (ensure it's not deleted)
  async update(seriesCode: string, updateSectorDto: Partial<CreateSectorDto>) {
    const updatedSector = await this.sectorModel
      .findOneAndUpdate(
        { seriesCode, deleted: false }, // Exclude soft-deleted records
        { $set: updateSectorDto },
        { new: true },
      )
      .select('-deleted')
      .exec();

    if (!updatedSector) {
      throw new NotFoundException(
        `Sector with seriesCode '${seriesCode}' not found or deleted`,
      );
    }

    return updatedSector;
  }

  //Soft delete a sector
  async softDelete(id: string) {
    const sector = await this.sectorModel
      .findOne({ _id: id, deleted: false })
      .select('-deleted')
      .exec();
    if (!sector) {
      throw new NotFoundException(`Sector with id '${id}' not found`);
    }

    if (sector.deleted) {
      throw new BadRequestException(
        `Sector with id '${id}' is already deleted`,
      );
    }

    return this.sectorModel
      .findOneAndUpdate({ _id: id }, { $set: { deleted: true } }, { new: true })
      .exec();
  }
}
