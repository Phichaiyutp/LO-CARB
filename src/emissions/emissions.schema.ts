import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmissionDocument = Emission & Document;

@Schema({ timestamps: true })
export class Emission {
  @Prop({ type: Types.ObjectId, ref: 'Country', required: true })
  countryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sector', required: true })
  sectorId: Types.ObjectId;

  @Prop({ required: true, min: 1900, max: 2100 })
  year: number;

  @Prop({ required: false, default: 0 })
  amount?: number;

  @Prop({ default: false })
  deleted?: boolean;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const EmissionSchema = SchemaFactory.createForClass(Emission);
