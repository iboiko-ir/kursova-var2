import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);

export class CreatePartyDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 120, example: 'Northwind Traders' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  @MaxLength(120)
  name;

  @ApiProperty({ type: String, required: false, nullable: true, maxLength: 500, example: 'Phone: +380 44 000 00 00' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  contactDetails;
}

export class UpdatePartyDto {
  @ApiProperty({ type: String, required: false, minLength: 1, maxLength: 120 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'name must not be empty' })
  @MaxLength(120)
  name;

  @ApiProperty({ type: String, required: false, nullable: true, maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  contactDetails;
}

export class PartyDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  name;

  @ApiProperty({ type: String, nullable: true })
  contactDetails;

  @ApiProperty({ type: Boolean })
  archived;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt;
}
