import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../common/page';

export const MOVEMENT_TYPES = ['receipt', 'shipment', 'write_off'];

const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);
const costToString = ({ value }) => (typeof value === 'number' ? String(value) : value);
const COST_PATTERN = /^\d{1,7}(\.\d{1,2})?$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class MovementLineDto {
  @ApiProperty({ type: Number, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId;

  @ApiProperty({ type: Number, minimum: 1, maximum: 1000000, description: 'Whole units.' })
  @IsInt()
  @Min(1)
  @Max(1000000)
  quantity;

  @ApiProperty({
    type: String,
    required: false,
    example: '12.50',
    description: 'Receipt only. Unit cost in UAH. The catalog price is used if it is omitted.',
  })
  @IsOptional()
  @Transform(costToString)
  @Matches(COST_PATTERN, { message: 'unitCost must be a non-negative amount with at most 2 decimal places' })
  unitCost;
}

export class CreateMovementDto {
  @ApiProperty({ type: String, enum: MOVEMENT_TYPES })
  @IsIn(MOVEMENT_TYPES)
  type;

  @ApiProperty({ type: Number, required: false, description: 'Required for a receipt. Not allowed otherwise.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  supplierId;

  @ApiProperty({ type: Number, required: false, description: 'Required for a shipment. Not allowed otherwise.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  counterpartyId;

  @ApiProperty({
    type: String,
    required: false,
    maxLength: 500,
    description: 'Required for a write-off. Not allowed otherwise.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'reason must not be empty' })
  @MaxLength(500)
  reason;

  @ApiProperty({ type: [MovementLineDto], minItems: 1, maxItems: 100, description: 'Distinct products only.' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MovementLineDto)
  lines;
}

export class MovementQueryDto extends PaginationDto {
  @ApiProperty({ type: String, required: false, enum: MOVEMENT_TYPES })
  @IsOptional()
  @IsIn(MOVEMENT_TYPES)
  type;

  @ApiProperty({ type: Number, required: false, description: 'Show movements that include this product.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId;

  @ApiProperty({ type: String, required: false, example: '2026-01-31', description: 'First UTC day (YYYY-MM-DD).' })
  @IsOptional()
  @Matches(DAY_PATTERN, { message: 'dateFrom must be a date in the format YYYY-MM-DD' })
  dateFrom;

  @ApiProperty({
    type: String,
    required: false,
    example: '2026-01-31',
    description: 'Last UTC day (YYYY-MM-DD). The whole day is included.',
  })
  @IsOptional()
  @Matches(DAY_PATTERN, { message: 'dateTo must be a date in the format YYYY-MM-DD' })
  dateTo;

  @ApiProperty({ type: String, required: false, maxLength: 20, description: 'Part of the document number.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  search;
}

export class PartySnapshotDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  name;

  @ApiProperty({ type: String, nullable: true })
  contactDetails;
}

export class MovementLineResponseDto {
  @ApiProperty({ type: Number })
  productId;

  @ApiProperty({ type: String, description: 'SKU at the time of posting.' })
  sku;

  @ApiProperty({ type: String, description: 'Product name at the time of posting.' })
  productName;

  @ApiProperty({ type: Number })
  quantity;

  @ApiProperty({ type: String, example: '12.5000', description: 'Unit cost in UAH used by the document.' })
  unitCost;

  @ApiProperty({ type: String, example: '125.0000', description: 'Line inventory value in UAH, always positive.' })
  value;

  @ApiProperty({ type: Number, description: 'Signed stock change.' })
  quantityDelta;

  @ApiProperty({ type: String, example: '-125.0000', description: 'Signed inventory value change in UAH.' })
  valueDelta;
}

export class MovementSummaryDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String, example: 'RN-000001' })
  number;

  @ApiProperty({ type: String, enum: MOVEMENT_TYPES })
  type;

  @ApiProperty({ type: String, format: 'date-time', description: 'Server time in UTC.' })
  postedAt;

  @ApiProperty({ type: String, nullable: true, description: 'Supplier or counterparty name.' })
  partyName;

  @ApiProperty({ type: String, nullable: true })
  reason;

  @ApiProperty({ type: String })
  createdBy;

  @ApiProperty({ type: Number })
  lineCount;

  @ApiProperty({ type: String, example: '125.0000', description: 'Total inventory value of the document in UAH.' })
  totalValue;
}

export class MovementDetailDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String, example: 'RN-000001' })
  number;

  @ApiProperty({ type: String, enum: MOVEMENT_TYPES })
  type;

  @ApiProperty({ type: String, format: 'date-time', description: 'Server time in UTC.' })
  postedAt;

  @ApiProperty({ type: PartySnapshotDto, nullable: true, description: 'Supplier details at the time of posting.' })
  supplier;

  @ApiProperty({ type: PartySnapshotDto, nullable: true, description: 'Counterparty details at the time of posting.' })
  counterparty;

  @ApiProperty({ type: String, nullable: true })
  reason;

  @ApiProperty({ type: String })
  createdBy;

  @ApiProperty({ type: [MovementLineResponseDto] })
  lines;

  @ApiProperty({ type: String, example: '125.0000', description: 'Total inventory value of the document in UAH.' })
  totalValue;
}
