import { Dependencies, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UserSchema } from '../database/entities';
import { verifyPassword } from './password';

@Injectable()
@Dependencies(DataSource, JwtService)
export class AuthService {
  constructor(dataSource, jwtService) {
    this.dataSource = dataSource;
    this.jwtService = jwtService;
  }

  async login(username, password) {
    const user = await this.dataSource.getRepository(UserSchema).findOneBy({ username });
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!valid) {
      throw new UnauthorizedException('Invalid username or password.');
    }
    const accessToken = await this.jwtService.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: { id: user.id, username: user.username, role: user.role } };
  }
}
