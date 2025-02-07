import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CountryResponseDto } from 'src/countries/dto/country-response.dto';
import { SectorResponseDto } from 'src/sectors/dto/sector-response.dto';

export class EmissionDataDto {
  @ApiProperty({ example: '67a441199e885d5f7f24b7c1' })
  @Expose()
  _id: string;

  @ApiProperty({ example: 1991 })
  @Expose()
  year: number;

  @ApiProperty({ example: -3.47469603366567 })
  @Expose()
  amount: number;

  @ApiProperty({ example: '2025-02-06T05:10:01.297Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-02-06T05:10:01.297Z' })
  @Expose()
  updatedAt: Date;
}

export class EmissionResponseDto extends EmissionDataDto {
  @ApiProperty({ example: '2025-02-07T03:19:37.713Z', required: false })
  @Expose()
  ts?: string;

  @ApiProperty({ required: false })
  @Expose()
  filter?: any;

  @ApiProperty({ type: CountryResponseDto })
  @Expose()
  @Type(() => CountryResponseDto)
  country: CountryResponseDto;

  @ApiProperty({ type: SectorResponseDto })
  @Expose()
  @Type(() => SectorResponseDto)
  sector: SectorResponseDto;
}

export class PaginatedEmissionResponseDto {
  @ApiProperty({ example: 118424 })
  @Expose()
  total: number;

  @ApiProperty({ example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 11843 })
  @Expose()
  totalPages: number;

  @ApiProperty({ type: [EmissionResponseDto] })
  @Expose()
  @Type(() => EmissionResponseDto)
  data: EmissionResponseDto[];

  @ApiProperty({ required: false })
  @Expose()
  filter?: any = {};

  @ApiProperty({ example: '2025-02-07T03:19:37.713Z', required: false })
  @Expose()
  ts?: string;
}

export class EmissionBySectorDataDto {
  @ApiProperty({ example: 2938.3992 })
  @Expose()
  totalEmissions: number;

  @ApiProperty({ example: 1991 })
  @Expose()
  year: number;

  @ApiProperty({ example: 123 })
  @Expose()
  count: number;

  @ApiProperty({ type: CountryResponseDto })
  @Expose()
  @Type(() => CountryResponseDto)
  country: CountryResponseDto;

  @ApiProperty({ type: SectorResponseDto })
  @Expose()
  @Type(() => SectorResponseDto)
  sector: SectorResponseDto;
}
export class EmissionBySectorResponseDto {
  @ApiProperty({ example: '2025-02-07T03:19:37.713Z', required: false })
  @Expose()
  ts?: string;

  @ApiProperty({ required: false })
  @Expose()
  filter?: any = {};

  @ApiProperty({ type: [EmissionBySectorDataDto] })
  @Expose()
  @Type(() => EmissionBySectorDataDto)
  data: EmissionBySectorDataDto[];
}

export class EmissionBySummaryDataDto {
  @ApiProperty({ example: 2938.3992 })
  @Expose()
  totalEmissions: number;

  @ApiProperty({ type: CountryResponseDto })
  @Expose()
  @Type(() => CountryResponseDto)
  country: CountryResponseDto;

  @ApiProperty({ type: SectorResponseDto })
  @Expose()
  @Type(() => SectorResponseDto)
  sector: SectorResponseDto;
}
export class PaginatedEmissionBySummaryResponseDto {
  @ApiProperty({ type: [EmissionBySummaryDataDto] })
  @Expose()
  @Type(() => EmissionBySummaryDataDto)
  data: EmissionBySummaryDataDto[];
  @ApiProperty({ example: 118424 })
  @Expose()
  total: number;

  @ApiProperty({ example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 11843 })
  @Expose()
  totalPages: number;

  @ApiProperty({ required: false })
  @Expose()
  filter?: any = {};

  @ApiProperty({ example: '2025-02-07T03:19:37.713Z', required: false })
  @Expose()
  ts?: string;
}

export class EmissionTrendRecordDto {
  @ApiProperty({ example: 1179793.0232743148 })
  @Expose()
  totalEmissions: number;

  @ApiProperty({ example: 1990 })
  @Expose()
  year: number;
}

export class EmissionTrendDataResponseDto{
  @ApiProperty({ example: '2025-02-07T09:41:13.784Z' })
  @Expose()
  ts: string;

  @ApiProperty({ required: false })
  @Expose()
  filter?: any = {};

  @ApiProperty({ type: CountryResponseDto })
  @Expose()
  @Type(() => CountryResponseDto)
  country: CountryResponseDto;

  @ApiProperty({ example: 31 })
  @Expose()
  totalRecords: number;

  @ApiProperty({ type: [EmissionTrendRecordDto] })
  @Expose()
  data: EmissionTrendRecordDto[];
}

export class EmissionGasRecordDto {
  @ApiProperty({ example: 1991 })
  @Expose()
  year: number;

  @ApiProperty({ example: -3.47469603366567 })
  @Expose()
  amount: number;

  @ApiProperty({ type: CountryResponseDto })
  @Expose()
  @Type(() => CountryResponseDto)
  country: CountryResponseDto;

  @ApiProperty({ type: SectorResponseDto })
  @Expose()
  @Type(() => SectorResponseDto)
  sector: SectorResponseDto;
}

export class PaginatedEmissionGasResponseDto {
  @ApiProperty({ example: '2025-02-07T10:22:45.979Z' })
  @Expose()
  ts: string;

  @ApiProperty({ required: false })
  @Expose()
  filter?: any = {};
  
  @ApiProperty({ example: 'CO₂' })
  @Expose()
  gasType: string;

  @ApiProperty({ example: 118424 })
  @Expose()
  total: number;

  @ApiProperty({ example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 11843 })
  @Expose()
  totalPages: number;

  @ApiProperty({ type: [EmissionGasRecordDto] })
  @Expose()
  @Type(() => EmissionGasRecordDto)
  data: EmissionGasRecordDto[];
}