import { Bind, Body, Controller, Dependencies, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors } from '../common/api-errors';
import { ParamTypes } from '../common/param-types';
import { IdParamDto } from '../common/id-param.dto';
import { PageQueryDto, pageOf } from '../common/page';
import { ROLE_ADMIN, Roles } from '../auth/decorators';
import { CreatePartyDto, PartyDto, UpdatePartyDto } from './party.dto';
import { COUNTERPARTY_SERVICE } from './parties.tokens';

const CounterpartyPage = pageOf(PartyDto, 'CounterpartyPage');

@ApiTags('Counterparties')
@ApiBearerAuth()
@Controller('counterparties')
@Dependencies(COUNTERPARTY_SERVICE)
export class CounterpartiesController {
  constructor(service) {
    this.service = service;
  }

  @Get()
  @Bind(Query())
  @ParamTypes(PageQueryDto)
  @ApiOperation({ summary: 'List counterparties' })
  @ApiOkResponse({ type: CounterpartyPage })
  @ApiErrors(400, 401)
  list(query) {
    return this.service.list(query);
  }

  @Get(':id')
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Get a counterparty' })
  @ApiOkResponse({ type: PartyDto })
  @ApiErrors(400, 401, 404)
  get({ id }) {
    return this.service.get(id);
  }

  @Post()
  @Roles(ROLE_ADMIN)
  @Bind(Body())
  @ParamTypes(CreatePartyDto)
  @ApiOperation({ summary: 'Create a counterparty (admin)' })
  @ApiCreatedResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 409)
  create(dto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(ROLE_ADMIN)
  @Bind(Param(), Body())
  @ParamTypes(IdParamDto, UpdatePartyDto)
  @ApiOperation({ summary: 'Edit a counterparty (admin)' })
  @ApiOkResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 404, 409)
  update({ id }, dto) {
    return this.service.update(id, dto);
  }

  @Post(':id/archive')
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Archive a counterparty (admin)', description: 'Archived counterparties cannot be used for new products or receipts.' })
  @ApiCreatedResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 404)
  archive({ id }) {
    return this.service.setArchived(id, true);
  }

  @Post(':id/restore')
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Restore an archived counterparty (admin)' })
  @ApiCreatedResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 404)
  restore({ id }) {
    return this.service.setArchived(id, false);
  }
}
