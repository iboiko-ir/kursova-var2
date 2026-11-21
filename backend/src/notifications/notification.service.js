import { Dependencies, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationSchema } from '../database/entities';

@Injectable()
@Dependencies(DataSource)
export class NotificationService {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async list({ page, limit, status }) {
    const query = this.dataSource
      .getRepository(NotificationSchema)
      .createQueryBuilder('notification')
      .innerJoinAndSelect('notification.product', 'product');
    if (status !== 'all') {
      query.where('notification.status = :status', { status });
    }
    const [notifications, total] = await query
      .orderBy('notification.status', 'ASC')
      .addOrderBy('notification.updatedAt', 'DESC')
      .addOrderBy('notification.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const items = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      status: notification.status,
      product: {
        id: notification.product.id,
        name: notification.product.name,
        sku: notification.product.sku,
        archived: notification.product.archived,
      },
      quantity: notification.quantity,
      minStock: notification.minStock,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      resolvedAt: notification.resolvedAt,
    }));
    return { items, total, page, limit };
  }

  async summary() {
    const active = await this.dataSource.getRepository(NotificationSchema).countBy({ status: 'active' });
    return { active };
  }
}
