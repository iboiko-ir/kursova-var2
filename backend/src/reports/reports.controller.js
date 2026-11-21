import { Bind, Controller, Dependencies, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../common/api-errors';
import { ParamTypes } from '../common/param-types';
import {
  AsOfQueryDto,
  DynamicsQueryDto,
  InventoryAsOfReportDto,
  InventoryValuationReportDto,
  MovementDynamicsReportDto,
} from './report.dto';
import { ReportService } from './report.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@Dependencies(ReportService)
export class ReportsController {
  constructor(reportService) {
    this.reportService = reportService;
  }

  @Get('inventory-as-of')
  @Bind(Query())
  @ParamTypes(AsOfQueryDto)
  @ApiOperation({
    summary: 'Inventory as of a date',
    description: 'Historical quantity, unit inventory cost and value from ledger deltas. The whole UTC day is included.',
  })
  @ApiOkResponse({ type: InventoryAsOfReportDto })
  @ApiErrors(400, 401)
  inventoryAsOf(query) {
    return this.reportService.generate('inventory-as-of', query);
  }

  @Get('movement-dynamics')
  @Bind(Query())
  @ParamTypes(DynamicsQueryDto)
  @ApiOperation({
    summary: 'Movement dynamics',
    description: 'Daily received, shipped and written-off quantities for a UTC date range, optionally for one product.',
  })
  @ApiOkResponse({ type: MovementDynamicsReportDto })
  @ApiErrors(400, 401)
  movementDynamics(query) {
    return this.reportService.generate('movement-dynamics', query);
  }

  @Get('inventory-valuation')
  @Bind(Query())
  @ParamTypes(AsOfQueryDto)
  @ApiOperation({
    summary: 'Financial valuation of inventory',
    description: 'Inventory value by product and a grand total on a date. Values are ledger costs, not sales prices.',
  })
  @ApiOkResponse({ type: InventoryValuationReportDto })
  @ApiErrors(400, 401)
  inventoryValuation(query) {
    return this.reportService.generate('inventory-valuation', query);
  }
}
