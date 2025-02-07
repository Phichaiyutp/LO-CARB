import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: '67a579cf10c08cad55410686' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: ['user'] })
  @Expose()
  roles: string[];

  @ApiProperty({ example: '2025-02-07T03:11:11.406Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-02-07T03:11:11.406Z' })
  @Expose()
  updatedAt: Date;
}
