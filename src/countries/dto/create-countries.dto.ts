import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length } from '@nestjs/class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'Greece', description: 'Country name in English' })
  @IsNotEmpty()
  name: string; //English country name

  @ApiProperty({
    example: 'GRC',
    description: 'ISO 3166-1 Alpha-3 country code',
  })
  @IsNotEmpty()
  @Length(3, 3)
  alpha3: string; //Primary identifier (used as foreign key)
}
