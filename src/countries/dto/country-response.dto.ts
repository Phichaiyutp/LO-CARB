import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CountryResponseDto {
  @ApiProperty({ example: '67a441199e885d5f7f24b7c1' })
  @Expose()
  _id: string;

  @ApiProperty({ example: 'United States' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'USA' })
  @Expose()
  alpha3: string;

  @ApiProperty({ example: '2025-02-07T03:11:11.406Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-02-07T03:11:11.406Z' })
  @Expose()
  updatedAt: Date;
}

export class PaginatedCountryResponseDto {
  @ApiProperty({ example: 100 })
  @Expose()
  total: number;

  @ApiProperty({ example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 10 })
  @Expose()
  totalPages: number;

  @ApiProperty({ type: [CountryResponseDto] })
  @Expose()
  data: CountryResponseDto[];
}
