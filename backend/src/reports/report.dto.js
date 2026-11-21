import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { DAY_PATTERN } from '../common/dates';

export class AsOfQueryDto {
  @ApiProperty({
    type: String,
    example: '2026-01-31',
    description: 'UTC calendar day (YYYY-MM-DD). The whole day is included.',
  })
  @Matches(DAY_PATTERN, { message: 'date must be a date in the format YYYY-MM-DD' })
  date;
}

export class DynamicsQueryDto {
  @ApiProperty({ type: String, example: '2026-01-01', description: 'First UTC day (YYYY-MM-DD).' })
  @Matches(DAY_PATTERN, { message: 'dateFrom must be a date in the format YYYY-MM-DD' })
  dateFrom;

  @ApiProperty({ type: String, example: '2026-01-31', description: 'Last UTC day (YYYY-MM-DD). At most 366 days.' })
  @Matches(DAY_PATTERN, { message: 'dateTo must be a date in the format YYYY-MM-DD' })
  dateTo;

  @ApiProperty({ type: Number, required: false, description: 'Limit the report to one product.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId;
}

export class InventoryAsOfItemDto {
  @ApiProperty({ type: Number })
  productId;

  @ApiProperty({ type: String, description: 'SKU at the cutoff.' })
  sku;

  @ApiProperty({ type: String, description: 'Product name at the cutoff.' })
  name;

  @ApiProperty({ type: Number, description: 'Sum of quantity deltas up to the cutoff.' })
  quantity;

  @ApiProperty({ type: String, example: '15.0000', description: 'Inventory value divided by quantity, in UAH.' })
  unitCost;

  @ApiProperty({ type: String, example: '300.0000', description: 'Sum of value deltas up to the cutoff, in UAH.' })
  value;
}

export class InventoryAsOfReportDto {
  @ApiProperty({ type: String, example: '2026-01-31' })
  date;

  @ApiProperty({ type: [InventoryAsOfItemDto], description: 'Products with ledger history up to the cutoff.' })
  items;
}

export class InventoryValuationItemDto {
  @ApiProperty({ type: Number })
  productId;

  @ApiProperty({ type: String })
  sku;

  @ApiProperty({ type: String })
  name;

  @ApiProperty({ type: Number })
  quantity;

  @ApiProperty({ type: String, example: '300.0000', description: 'Inventory value in UAH from ledger cost values.' })
  value;
}

export class InventoryValuationReportDto {
  @ApiProperty({ type: String, example: '2026-01-31' })
  date;

  @ApiProperty({ type: [InventoryValuationItemDto], description: 'Products with stock at the cutoff.' })
  items;

  @ApiProperty({ type: String, example: '1250.5000', description: 'Grand total in UAH.' })
  totalValue;
}

export class DynamicsItemDto {
  @ApiProperty({ type: String, example: '2026-01-10', description: 'UTC day.' })
  date;

  @ApiProperty({ type: Number })
  received;

  @ApiProperty({ type: Number })
  shipped;

  @ApiProperty({ type: Number })
  writtenOff;
}

export class DynamicsTotalsDto {
  @ApiProperty({ type: Number })
  received;

  @ApiProperty({ type: Number })
  shipped;

  @ApiProperty({ type: Number })
  writtenOff;
}

export class MovementDynamicsReportDto {
  @ApiProperty({ type: String, example: '2026-01-01' })
  dateFrom;

  @ApiProperty({ type: String, example: '2026-01-31' })
  dateTo;

  @ApiProperty({ type: Number, nullable: true })
  productId;

  @ApiProperty({ type: [DynamicsItemDto], description: 'One row for every UTC day in the range.' })
  items;

  @ApiProperty({ type: DynamicsTotalsDto })
  totals;
}
