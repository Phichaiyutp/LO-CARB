import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'testuser', description: 'Unique username' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty({ example: 'test@example.com', description: 'Valid email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123', description: 'User password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
