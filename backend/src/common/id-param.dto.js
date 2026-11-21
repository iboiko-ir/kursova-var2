import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class IdParamDto {
  @ApiProperty({ type: Number, minimum: 1, description: 'Record identifier.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  id;
}
