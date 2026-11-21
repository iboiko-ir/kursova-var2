import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../common/page';

export const NOTIFICATION_FILTERS = ['active', 'resolved', 'all'];

export class NotificationQueryDto extends PaginationDto {
  @ApiProperty({ type: String, required: false, enum: NOTIFICATION_FILTERS, default: 'active' })
  @IsOptional()
  @IsIn(NOTIFICATION_FILTERS)
  status = 'active';
}

export class NotificationProductDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  name;

  @ApiProperty({ type: String })
  sku;

  @ApiProperty({ type: Boolean })
  archived;
}

export class NotificationDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String, enum: ['low_stock'] })
  type;

  @ApiProperty({ type: String, enum: ['active', 'resolved'] })
  status;

  @ApiProperty({ type: NotificationProductDto })
  product;

  @ApiProperty({ type: Number, description: 'Stock quantity at the last update.' })
  quantity;

  @ApiProperty({ type: Number, description: 'Minimum stock threshold at the last update.' })
  minStock;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  resolvedAt;
}

export class NotificationSummaryDto {
  @ApiProperty({ type: Number, description: 'Number of active low-stock notifications.' })
  active;
}
