import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';

export class CreateSectorDto {
  @ApiProperty({ example: 'Energy', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: 'CO₂', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  gasType?: string;

  @ApiProperty({ example: '% change from 1990', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    example: 'Total greenhouse gas emissions (% change from 1990)',
    required: true,
  })
  @Expose()
  @IsString()
  seriesName: string;

  @ApiProperty({ example: 'EN.ATM.GHGT.ZG', required: true })
  @Expose()
  @IsString()
  seriesCode: string;
}
