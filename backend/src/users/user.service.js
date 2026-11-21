import { ConflictException, Dependencies, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { hashPassword } from '../auth/password';
import { UserSchema } from '../database/entities';

const UNIQUE_VIOLATION = '23505';

function toUserAccount(user) {
  return { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt };
}

@Injectable()
@Dependencies(DataSource)
export class UserService {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async list({ page, limit }) {
    const [users, total] = await this.dataSource.getRepository(UserSchema).findAndCount({
      order: { username: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: users.map(toUserAccount), total, page, limit };
  }

  async create({ username, password, role }) {
    const repository = this.dataSource.getRepository(UserSchema);
    const passwordHash = await hashPassword(password);
    try {
      const savedUser = await repository.save(repository.create({ username, passwordHash, role }));
      return toUserAccount(savedUser);
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ConflictException('A user with this username already exists.');
      }
      throw error;
    }
  }
}
