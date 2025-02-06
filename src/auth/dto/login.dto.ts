import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'testuser', description: 'Username' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'SecurePassword123', description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
