import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: String, maxLength: 50, example: 'operator' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username;

  @ApiProperty({ type: String, maxLength: 200, format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password;
}

export class UserDto {
  @ApiProperty({ type: Number })
  id;

  @ApiProperty({ type: String })
  username;

  @ApiProperty({ type: String, enum: ['admin', 'operator'] })
  role;
}

export class LoginResponseDto {
  @ApiProperty({ type: String, description: 'JWT access token. Send it as "Authorization: Bearer <token>".' })
  accessToken;

  @ApiProperty({ type: UserDto })
  user;
}
