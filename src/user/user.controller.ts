import {
  Controller,
  Get,
  UseGuards,
  Request,
  Body,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RegisterDTO } from './dto/register.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard,ThrottlerGuard) 
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        message: 'User registered successfully',
        user: {
          id: '65b1234abcde56789f012345',
          email: 'john.doe@example.com',
          name: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Invalid email format',
          'Password must be at least 8 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiBody({
    type: RegisterDTO,
    description: 'User registration details',
  })
  async register(@Body() registerDTO: RegisterDTO) {
    return this.userService.create(registerDTO);
  }
  
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.Admin,Role.User)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile (requires authentication)' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '65b1234abcde56789f012345',
        email: 'john.doe@example.com',
        name: 'John Doe',
        roles: ['user'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT Token missing or invalid',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized access: Invalid or missing JWT',
        error: 'Unauthorized',
      },
    },
  })
  getProfile(@Request() req) {
    const user = this.userService.findByEmail(req.user.email);
    return user;
  }
}
