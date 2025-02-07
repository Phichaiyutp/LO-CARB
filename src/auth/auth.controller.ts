import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDTO } from './dto/login.dto';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login and receive JWT token' })
  @ApiBody({
    type: LoginDTO,
    description: 'User login credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Returns JWT token',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  
  async login(@Body() loginDTO: LoginDTO) {

    if (!loginDTO.email || !loginDTO.password) {
      throw new BadRequestException('Email and password are required');
    }
    
    const user = await this.authService.validateUser(loginDTO.email, loginDTO.password);
    return this.authService.login(user);
  }
}
