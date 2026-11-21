import { BadRequestException, ConflictException, Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ROLE_ADMIN } from '../auth/decorators';
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
    const userRepository = this.dataSource.getRepository(UserSchema);
    const passwordHash = await hashPassword(password);
    return this.saveOrReportDuplicate(async () =>
      toUserAccount(await userRepository.save(userRepository.create({ username, passwordHash, role }))),
    );
  }

  async update(userId, changes, currentUser) {
    if (changes.username === undefined && changes.password === undefined && changes.role === undefined) {
      throw new BadRequestException('At least one field must be provided.');
    }
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserSchema);
      const user = await this.findUser(userRepository, userId);
      const losesAdminRole = user.role === ROLE_ADMIN && changes.role !== undefined && changes.role !== ROLE_ADMIN;
      if (losesAdminRole && user.id === currentUser.id) {
        throw new ConflictException('You cannot remove the admin role from your own account.');
      }
      if (losesAdminRole) {
        await this.requireAnotherAdmin(manager, user.id);
      }
      if (changes.username !== undefined) {
        user.username = changes.username;
      }
      if (changes.role !== undefined) {
        user.role = changes.role;
      }
      if (changes.password !== undefined) {
        user.passwordHash = await hashPassword(changes.password);
      }
      return this.saveOrReportDuplicate(async () => toUserAccount(await userRepository.save(user)));
    });
  }

  async delete(userId, currentUser) {
    await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserSchema);
      const user = await this.findUser(userRepository, userId);
      if (user.id === currentUser.id) {
        throw new ConflictException('You cannot delete your own account.');
      }
      if (user.role === ROLE_ADMIN) {
        await this.requireAnotherAdmin(manager, user.id);
      }
      const [{ documentCount }] = await manager.query(
        'SELECT count(*)::int AS "documentCount" FROM stock_movements WHERE created_by_id = $1',
        [user.id],
      );
      if (documentCount > 0) {
        throw new ConflictException(
          'This user has posted documents and cannot be deleted. Change the password to block the account.',
        );
      }
      await userRepository.delete({ id: user.id });
    });
  }

  async findUser(userRepository, userId) {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }
    return user;
  }

  async requireAnotherAdmin(manager, userId) {
    const [{ otherAdminCount }] = await manager.query(
      'SELECT count(*)::int AS "otherAdminCount" FROM users WHERE role = $1 AND id <> $2',
      [ROLE_ADMIN, userId],
    );
    if (otherAdminCount === 0) {
      throw new ConflictException('The application must have at least one admin.');
    }
  }

  async saveOrReportDuplicate(saveOperation) {
    try {
      return await saveOperation();
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ConflictException('A user with this username already exists.');
      }
      throw error;
    }
  }
}
