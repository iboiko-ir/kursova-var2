import { Bind, Body, Controller, Dependencies, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../common/api-errors';
import { ParamTypes } from '../common/param-types';
import { LoginDto, LoginResponseDto, UserDto } from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators';

@ApiTags('Auth')
@Controller('auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Bind(Body())
  @ParamTypes(LoginDto)
  @ApiOperation({ summary: 'Log in and receive an access token' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiErrors(400, 401)
  login(dto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('me')
  @Bind(Req())
  @ParamTypes(Object)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user' })
  @ApiOkResponse({ type: UserDto })
  @ApiErrors(401)
  me(request) {
    return request.user;
  }
}
