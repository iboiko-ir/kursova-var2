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
import { SUPPLIER_SERVICE } from './parties.tokens';

const SupplierPage = pageOf(PartyDto, 'SupplierPage');

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@Dependencies(SUPPLIER_SERVICE)
export class SuppliersController {
  constructor(partyService) {
    this.partyService = partyService;
  }

  @Get()
  @Bind(Query())
  @ParamTypes(PageQueryDto)
  @ApiOperation({ summary: 'List suppliers' })
  @ApiOkResponse({ type: SupplierPage })
  @ApiErrors(400, 401)
  list(query) {
    return this.partyService.list(query);
  }

  @Get(':id')
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Get a supplier' })
  @ApiOkResponse({ type: PartyDto })
  @ApiErrors(400, 401, 404)
  get({ id }) {
    return this.partyService.get(id);
  }

  @Post()
  @Roles(ROLE_ADMIN)
  @Bind(Body())
  @ParamTypes(CreatePartyDto)
  @ApiOperation({ summary: 'Create a supplier (admin)' })
  @ApiCreatedResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 409)
  create(newParty) {
    return this.partyService.create(newParty);
  }

  @Patch(':id')
  @Roles(ROLE_ADMIN)
  @Bind(Param(), Body())
  @ParamTypes(IdParamDto, UpdatePartyDto)
  @ApiOperation({ summary: 'Edit a supplier (admin)' })
  @ApiOkResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 404, 409)
  update({ id }, changes) {
    return this.partyService.update(id, changes);
  }

  @Post(':id/archive')
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Archive a supplier (admin)', description: 'Archived suppliers cannot be used for new products or receipts.' })
  @ApiCreatedResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 404)
  archive({ id }) {
    return this.partyService.setArchived(id, true);
  }

  @Post(':id/restore')
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Restore an archived supplier (admin)' })
  @ApiCreatedResponse({ type: PartyDto })
  @ApiErrors(400, 401, 403, 404)
  restore({ id }) {
    return this.partyService.setArchived(id, false);
  }
}
