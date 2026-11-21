import { Dependencies, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UserSchema } from '../database/entities';
import { IS_PUBLIC_KEY } from './decorators';

@Injectable()
@Dependencies(Reflector, JwtService, DataSource)
export class JwtAuthGuard {
  constructor(reflector, jwtService, dataSource) {
    this.reflector = reflector;
    this.jwtService = jwtService;
    this.dataSource = dataSource;
  }

  async canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const [scheme, token] = (request.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication is required.');
    }

    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired.');
    }

    const user = await this.dataSource.getRepository(UserSchema).findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('Access token is invalid or expired.');
    }
    request.user = { id: user.id, username: user.username, role: user.role };
    return true;
  }
}
