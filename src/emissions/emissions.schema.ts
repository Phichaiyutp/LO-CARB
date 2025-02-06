import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmissionDocument = Emission & Document;

@Schema({ timestamps: true })
export class Emission {
  @Prop({ type: Types.ObjectId, ref: 'Country', required: true })
  countryId: Types.ObjectId; //Links to `countries` collection

  @Prop({ type: Types.ObjectId, ref: 'Sector', required: true })
  sectorId: Types.ObjectId; //Links to `sectors` collection

  @Prop({ required: true, min: 1900, max: 2100 })
  year: number; //Year of the emission record

  @Prop({ required: false, default: 0 })
  amount?: number; //Quantity of emissions (kt CO₂ equivalent)

  @Prop({default: false })
  deleted?: boolean //Seft delete
}

export const EmissionSchema = SchemaFactory.createForClass(Emission);
