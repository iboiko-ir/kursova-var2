import { Bind, Body, Controller, Dependencies, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../common/api-errors';
import { IdParamDto } from '../common/id-param.dto';
import { ParamTypes } from '../common/param-types';
import { pageOf } from '../common/page';
import { CreateMovementDto, MovementDetailDto, MovementQueryDto, MovementSummaryDto } from './movement.dto';
import { MovementService } from './movement.service';

const MovementPage = pageOf(MovementSummaryDto, 'MovementPage');

@ApiTags('Movements')
@ApiBearerAuth()
@Controller('movements')
@Dependencies(MovementService)
export class MovementsController {
  constructor(movementService) {
    this.movementService = movementService;
  }

  @Get()
  @Bind(Query())
  @ParamTypes(MovementQueryDto)
  @ApiOperation({
    summary: 'List stock movements',
    description: 'Newest first. Date filters use UTC calendar days and include the whole day of dateTo.',
  })
  @ApiOkResponse({ type: MovementPage })
  @ApiErrors(400, 401)
  list(query) {
    return this.movementService.list(query);
  }

  @Get(':id')
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Get a posted movement with its lines' })
  @ApiOkResponse({ type: MovementDetailDto })
  @ApiErrors(400, 401, 404)
  get({ id }) {
    return this.movementService.get(id);
  }

  @Post()
  @Bind(Body(), Req())
  @ParamTypes(CreateMovementDto, Object)
  @ApiOperation({
    summary: 'Post a receipt, shipment or write-off',
    description:
      'The movement is posted immediately in one transaction and cannot be edited or deleted. ' +
      'A receipt needs a supplier, a shipment needs a counterparty and a write-off needs a reason. ' +
      'Stock cannot become negative. If any line fails, nothing is saved.',
  })
  @ApiCreatedResponse({ type: MovementDetailDto })
  @ApiErrors(400, 401, 409)
  post(newMovement, request) {
    return this.movementService.post(newMovement, request.user);
  }
}
