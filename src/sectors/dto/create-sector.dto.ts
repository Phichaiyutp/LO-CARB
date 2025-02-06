import { ApiProperty } from '@nestjs/swagger';

export class CreateSectorDto {
  @ApiProperty({
    description: 'Full name of the emission series (e.g., "CO₂ emissions from buildings")',
    example: 'CO₂ emissions from buildings',
  })
  seriesName: string;

  @ApiProperty({
    description: 'World Bank Series Code (e.g., "EN.CO2.BLDG.ZS")',
    example: 'EN.CO2.BLDG.ZS',
  })
  seriesCode: string;
}
