import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SectorResponseDto {
  @ApiProperty({ example: '67a441199e885d5f7f24b7c1' })
  @Expose()
  _id: string;

  @ApiProperty({ example: 'Energy' })
  @Expose()
  industry: string;

  @ApiProperty({ example: 'CO₂' })
  @Expose()
  gasType: string;

  @ApiProperty({ example: '% of total emissions' })
  @Expose()
  unit: string;

  @ApiProperty({
    example: 'Total greenhouse gas emissions (% change from 1990)',
  })
  @Expose()
  seriesName: string;

  @ApiProperty({ example: 'EN.ATM.GHGT.ZG' })
  @Expose()
  seriesCode: string;

  @ApiProperty({ example: '2025-02-07T03:11:11.406Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-02-07T03:11:11.406Z' })
  @Expose()
  updatedAt: Date;
}
