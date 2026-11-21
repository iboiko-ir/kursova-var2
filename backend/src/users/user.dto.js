import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ROLE_ADMIN, ROLE_OPERATOR } from '../auth/decorators';

const USER_ROLES = [ROLE_ADMIN, ROLE_OPERATOR];
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,49}$/;

const trimAndLowercase = ({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class CreateUserDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 50,
    example: 'anna.petrenko',
    description: 'Unique login. It is converted to lower case.',
  })
  @Transform(trimAndLowercase)
  @IsString()
  @Matches(USERNAME_PATTERN, {
    message: 'username must contain 3-50 lower case letters, digits, dots, hyphens or underscores',
  })
  username;

  @ApiProperty({ type: String, minLength: 5, maxLength: 100, format: 'password' })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  password;

  @ApiProperty({ type: String, enum: USER_ROLES })
  @IsIn(USER_ROLES)
  role;
}

export class UserAccountDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  username;

  @ApiProperty({ type: String, enum: USER_ROLES })
  role;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt;
}
