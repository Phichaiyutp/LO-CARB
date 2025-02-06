import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDTO {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email (must be valid)',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'User password (minimum 8 characters)',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters' })
  password: string;
}
