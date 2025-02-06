import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDTO {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email (must be unique and valid)',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.trim().toLowerCase()) // Trim and lowercase email
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name: string;

  @ApiProperty({
    example: 'Password@123',
    description:
      'User password (minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character)',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;
}
