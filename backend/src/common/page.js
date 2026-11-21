import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PageQueryDto {
  @ApiProperty({ type: Number, required: false, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @ApiProperty({ type: Number, required: false, minimum: 1, maximum: 200, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 25;

  @ApiProperty({ type: String, required: false, maxLength: 100, description: 'Case-insensitive text search.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search;

  @ApiProperty({ type: Boolean, required: false, default: false, description: 'Include archived records.' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  includeArchived = false;
}

export function pageOf(ItemDto, name = `${ItemDto.name}Page`) {
  class Page {}
  Object.defineProperty(Page, 'name', { value: name });
  ApiProperty({ type: [ItemDto] })(Page.prototype, 'items');
  ApiProperty({ type: Number })(Page.prototype, 'total');
  ApiProperty({ type: Number })(Page.prototype, 'page');
  ApiProperty({ type: Number })(Page.prototype, 'limit');
  return Page;
}

export function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
