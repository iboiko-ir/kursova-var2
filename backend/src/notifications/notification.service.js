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
    const [rows, total] = await query
      .orderBy('notification.status', 'ASC')
      .addOrderBy('notification.updatedAt', 'DESC')
      .addOrderBy('notification.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const items = rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      product: {
        id: row.product.id,
        name: row.product.name,
        sku: row.product.sku,
        archived: row.product.archived,
      },
      quantity: row.quantity,
      minStock: row.minStock,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      resolvedAt: row.resolvedAt,
    }));
    return { items, total, page, limit };
  }

  async summary() {
    const active = await this.dataSource.getRepository(NotificationSchema).countBy({ status: 'active' });
    return { active };
  }
}
