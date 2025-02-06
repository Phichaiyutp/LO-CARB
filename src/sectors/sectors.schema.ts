import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SectorDocument = Sector & Document;

@Schema({ timestamps: true })
export class Sector {
  @Prop({ required: true })
  industry: string; //Industry Name (e.g., "Energy", "Industry", "Agriculture")

  @Prop({ required: true, index: true })
  gasType: string; //Type of greenhouse gas (e.g., "CO₂", "CH₄", "N₂O", "HFC")

  @Prop({ required: true })
  unit: string; //Measurement unit (e.g., "kt", "%")

  @Prop({ required: true })
  seriesName: string; //Full name of the emission series (e.g., "CO₂ emissions from buildings")

  @Prop({ required: true, unique: true })
  seriesCode: string; //World Bank Series Code (e.g., "EN.CO2.BLDG.ZS")

  @Prop({ default: false })
  deleted?: boolean //Seft delete
}

export const SectorSchema = SchemaFactory.createForClass(Sector);
