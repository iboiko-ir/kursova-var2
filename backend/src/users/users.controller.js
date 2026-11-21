import { Bind, Body, Controller, Dependencies, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE_ADMIN, Roles } from '../auth/decorators';
import { ApiErrors } from '../common/api-errors';
import { PaginationDto, pageOf } from '../common/page';
import { ParamTypes } from '../common/param-types';
import { CreateUserDto, UserAccountDto } from './user.dto';
import { UserService } from './user.service';

const UserAccountPage = pageOf(UserAccountDto, 'UserAccountPage');

@ApiTags('Users')
@ApiBearerAuth()
@Roles(ROLE_ADMIN)
@Controller('users')
@Dependencies(UserService)
export class UsersController {
  constructor(userService) {
    this.userService = userService;
  }

  @Get()
  @Bind(Query())
  @ParamTypes(PaginationDto)
  @ApiOperation({ summary: 'List users (admin)' })
  @ApiOkResponse({ type: UserAccountPage })
  @ApiErrors(400, 401, 403)
  list(query) {
    return this.userService.list(query);
  }

  @Post()
  @Bind(Body())
  @ParamTypes(CreateUserDto)
  @ApiOperation({ summary: 'Create a user (admin)', description: 'There is no public sign-up. Only an admin adds users.' })
  @ApiCreatedResponse({ type: UserAccountDto })
  @ApiErrors(400, 401, 403, 409)
  create(newUser) {
    return this.userService.create(newUser);
  }
}
