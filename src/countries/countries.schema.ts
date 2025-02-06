import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CountryDocument = Country & Document;

@Schema({ timestamps: true })
export class Country {
  @Prop({ required: true })
  name: string; //Country name in English

  @Prop({ required: true, unique: true, index: true, minlength: 3, maxlength: 3 })
  alpha3: string; //ISO 3166-1 Alpha-3 code (used as foreign key)

  @Prop({default: false })
  deleted?: boolean //Seft delete
}

export const CountrySchema = SchemaFactory.createForClass(Country);
