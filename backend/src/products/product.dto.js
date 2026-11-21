import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PageQueryDto } from '../common/page';

const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);
const normalizeSku = ({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const priceToString = ({ value }) => (typeof value === 'number' ? String(value) : value);

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,49}$/;
const PRICE_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
const PRICE_MESSAGE = 'catalogPrice must be a non-negative amount with at most 2 decimal places';
const SKU_MESSAGE =
  'sku must contain 1-50 letters, digits, dots, hyphens or underscores and start with a letter or digit';

export class CreateProductDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 150, example: 'Steel bolt M8 x 40' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  @MaxLength(150)
  name;

  @ApiProperty({
    type: String,
    maxLength: 50,
    example: 'BOLT-M8-40',
    description: 'Unique SKU. It is trimmed and converted to upper case.',
  })
  @Transform(normalizeSku)
  @IsString()
  @Matches(SKU_PATTERN, { message: SKU_MESSAGE })
  sku;

  @ApiProperty({ type: Number, minimum: 1, description: 'Identifier of an active supplier.' })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  supplierId;

  @ApiProperty({ type: String, example: '12.50', description: 'Catalog price in UAH, up to 2 decimal places.' })
  @Transform(priceToString)
  @Matches(PRICE_PATTERN, { message: PRICE_MESSAGE })
  catalogPrice;

  @ApiProperty({ type: Number, minimum: 0, example: 10, description: 'Low-stock threshold in whole units.' })
  @IsInt()
  @Min(0)
  @Max(1000000)
  minStock;
}

export class UpdateProductDto {
  @ApiProperty({ type: String, required: false, minLength: 1, maxLength: 150 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  @MaxLength(150)
  name;

  @ApiProperty({ type: String, required: false, maxLength: 50 })
  @IsOptional()
  @Transform(normalizeSku)
  @IsString()
  @Matches(SKU_PATTERN, { message: SKU_MESSAGE })
  sku;

  @ApiProperty({ type: Number, required: false, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  supplierId;

  @ApiProperty({ type: String, required: false, example: '12.50' })
  @IsOptional()
  @Transform(priceToString)
  @Matches(PRICE_PATTERN, { message: PRICE_MESSAGE })
  catalogPrice;

  @ApiProperty({ type: Number, required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  minStock;
}

export class ProductQueryDto extends PageQueryDto {
  @ApiProperty({ type: Number, required: false, minimum: 1, description: 'Show products of one supplier.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  supplierId;
}

export class ProductSupplierDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  name;

  @ApiProperty({ type: Boolean })
  archived;
}

export class ProductDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  name;

  @ApiProperty({ type: String })
  sku;

  @ApiProperty({ type: ProductSupplierDto })
  supplier;

  @ApiProperty({ type: String, example: '12.50', description: 'Catalog price in UAH.' })
  catalogPrice;

  @ApiProperty({ type: Number, description: 'Low-stock threshold.' })
  minStock;

  @ApiProperty({ type: Number, description: 'Current stock. It is zero until goods are received.' })
  quantity;

  @ApiProperty({ type: String, example: '125.0000', description: 'Inventory value in UAH (weighted-average cost).' })
  inventoryValue;

  @ApiProperty({ type: Boolean })
  archived;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt;
}
