import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Matches, Min, Max } from 'class-validator';

export class CreateEmissionDto {
  @ApiProperty({
    example: 'GRC',
    description: 'ISO 3166-1 alpha-3 country code (e.g., "USA", "GRC")',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'countryAlpha3 must be a valid ISO Alpha-3 code' })
  countryAlpha3: string;

  @ApiProperty({ example: 2023, description: 'Year of data recording' })
  @IsNumber()
  @Min(1900, { message: 'Year must be 1900 or later' })
  @Max(2100, { message: 'Year must be 2100 or earlier' })
  year: number;

  @ApiProperty({
    example: 'EN.CO2.BLDG.ZS',
    description: 'World Bank Series Code for the emission sector (e.g., "EN.CO2.BLDG.ZS")',
  })
  @IsString()
  @IsNotEmpty()
  sectorSeriesCode: string;

  @ApiProperty({ example: 50000, description: 'Quantity of gas emissions in metric tons' })
  @IsNumber()
  amount: number;
}
