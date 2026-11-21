import { Bind, Body, Controller, Delete, Dependencies, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ROLE_ADMIN, Roles } from '../auth/decorators';
import { ApiErrors } from '../common/api-errors';
import { IdParamDto } from '../common/id-param.dto';
import { PaginationDto, pageOf } from '../common/page';
import { ParamTypes } from '../common/param-types';
import { CreateUserDto, UpdateUserDto, UserAccountDto } from './user.dto';
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

  @Patch(':id')
  @Bind(Param(), Body(), Req())
  @ParamTypes(IdParamDto, UpdateUserDto, Object)
  @ApiOperation({
    summary: 'Edit a user (admin)',
    description: 'Changes the username, role or password. The last admin cannot lose the admin role.',
  })
  @ApiOkResponse({ type: UserAccountDto })
  @ApiErrors(400, 401, 403, 404, 409)
  update({ id }, changes, request) {
    return this.userService.update(id, changes, request.user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Bind(Param(), Req())
  @ParamTypes(IdParamDto, Object)
  @ApiOperation({
    summary: 'Delete a user (admin)',
    description: 'Only a user without posted documents can be deleted. You cannot delete yourself or the last admin.',
  })
  @ApiNoContentResponse({ description: 'The user was deleted.' })
  @ApiErrors(400, 401, 403, 404, 409)
  delete({ id }, request) {
    return this.userService.delete(id, request.user);
  }
}
