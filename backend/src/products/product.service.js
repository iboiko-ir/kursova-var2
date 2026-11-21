import { BadRequestException, ConflictException, Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { escapeLike } from '../common/page';
import { ProductSchema, SupplierSchema } from '../database/entities';

const UNIQUE_VIOLATION = '23505';

function toDto(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    supplier: {
      id: product.supplier.id,
      name: product.supplier.name,
      archived: product.supplier.archived,
    },
    catalogPrice: product.catalogPrice,
    minStock: product.minStock,
    quantity: product.quantity,
    archived: product.archived,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

@Injectable()
@Dependencies(DataSource)
export class ProductService {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async list({ page, limit, search, includeArchived, supplierId }) {
    const query = this.dataSource
      .getRepository(ProductSchema)
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.supplier', 'supplier');
    if (!includeArchived) {
      query.andWhere('product.archived = false');
    }
    if (supplierId) {
      query.andWhere('product.supplierId = :supplierId', { supplierId });
    }
    if (search) {
      query.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${escapeLike(search)}%`,
      });
    }
    const [items, total] = await query
      .orderBy('product.name', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items: items.map(toDto), total, page, limit };
  }

  async get(id) {
    return toDto(await this.load(this.dataSource.manager, id));
  }

  async create({ name, sku, supplierId, catalogPrice, minStock }) {
    return this.write(async (manager) => {
      await this.requireActiveSupplier(manager, supplierId);
      const repository = manager.getRepository(ProductSchema);
      const saved = await repository.save(repository.create({ name, sku, supplierId, catalogPrice, minStock }));
      return toDto(await this.load(manager, saved.id));
    });
  }

  async update(id, changes) {
    const fields = ['name', 'sku', 'supplierId', 'catalogPrice', 'minStock'].filter(
      (field) => changes[field] !== undefined,
    );
    if (fields.length === 0) {
      throw new BadRequestException('At least one field must be provided.');
    }
    return this.write(async (manager) => {
      const product = await this.load(manager, id);
      if (changes.supplierId !== undefined && changes.supplierId !== product.supplierId) {
        await this.requireActiveSupplier(manager, changes.supplierId);
      }
      const repository = manager.getRepository(ProductSchema);
      await repository.update(
        { id },
        Object.fromEntries(fields.map((field) => [field, changes[field]])),
      );
      return toDto(await this.load(manager, id));
    });
  }

  async setArchived(id, archived) {
    return this.write(async (manager) => {
      const product = await this.load(manager, id);
      if (!archived && product.supplier.archived) {
        throw new BadRequestException('The supplier of this product is archived. Restore the supplier first.');
      }
      await manager.getRepository(ProductSchema).update({ id }, { archived });
      return toDto(await this.load(manager, id));
    });
  }

  async load(manager, id) {
    const product = await manager
      .getRepository(ProductSchema)
      .findOne({ where: { id }, relations: { supplier: true } });
    if (!product) {
      throw new NotFoundException(`Product ${id} was not found.`);
    }
    return product;
  }

  async requireActiveSupplier(manager, supplierId) {
    const supplier = await manager.getRepository(SupplierSchema).findOneBy({ id: supplierId });
    if (!supplier || supplier.archived) {
      throw new BadRequestException('supplierId must refer to an existing, non-archived supplier.');
    }
  }

  // Product changes run in one transaction, so later stock checks can join it.
  async write(operation) {
    try {
      return await this.dataSource.transaction(operation);
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ConflictException('A product with this SKU already exists.');
      }
      throw error;
    }
  }
}
