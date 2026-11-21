import { BadRequestException, ConflictException, Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { escapeLike } from '../common/page';
import { ProductSchema, SupplierSchema } from '../database/entities';
import { MovementService } from '../inventory/movement.service';
import { StockChangeSubject } from '../inventory/stock-change.subject';

const UNIQUE_VIOLATION = '23505';
const EDITABLE_FIELDS = ['name', 'sku', 'supplierId', 'catalogPrice', 'minStock'];

function toProductResponse(product) {
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
    inventoryValue: product.inventoryValue,
    archived: product.archived,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

@Injectable()
@Dependencies(DataSource, StockChangeSubject, MovementService)
export class ProductService {
  constructor(dataSource, stockChangeSubject, movementService) {
    this.dataSource = dataSource;
    this.stockChangeSubject = stockChangeSubject;
    this.movementService = movementService;
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
    const [products, total] = await query
      .orderBy('product.name', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items: products.map(toProductResponse), total, page, limit };
  }

  async get(productId) {
    return toProductResponse(await this.findProduct(this.dataSource.manager, productId));
  }

  // Observer pattern: product changes also notify the stock change subject,
  // because a new minimum stock or archiving can create or resolve a notification.
  async create({ name, sku, supplierId, catalogPrice, minStock, initialQuantity }, user) {
    return this.runInTransaction(async (manager) => {
      await this.requireActiveSupplier(manager, supplierId);
      const productRepository = manager.getRepository(ProductSchema);
      const savedProduct = await productRepository.save(
        productRepository.create({ name, sku, supplierId, catalogPrice, minStock }),
      );
      if (initialQuantity > 0) {
        await this.movementService.postInTransaction(
          manager,
          { type: 'receipt', supplierId, lines: [{ productId: savedProduct.id, quantity: initialQuantity }] },
          user,
        );
      } else {
        await this.stockChangeSubject.notify({ manager }, savedProduct.id);
      }
      return toProductResponse(await this.findProduct(manager, savedProduct.id));
    });
  }

  async update(productId, changes) {
    const changedFields = EDITABLE_FIELDS.filter((field) => changes[field] !== undefined);
    if (changedFields.length === 0) {
      throw new BadRequestException('At least one field must be provided.');
    }
    return this.runInTransaction(async (manager) => {
      const product = await this.findProduct(manager, productId);
      if (changes.supplierId !== undefined && changes.supplierId !== product.supplierId) {
        await this.requireActiveSupplier(manager, changes.supplierId);
      }
      const newValues = Object.fromEntries(changedFields.map((field) => [field, changes[field]]));
      await manager.getRepository(ProductSchema).update({ id: productId }, newValues);
      await this.stockChangeSubject.notify({ manager }, productId);
      return toProductResponse(await this.findProduct(manager, productId));
    });
  }

  async setArchived(productId, archived) {
    return this.runInTransaction(async (manager) => {
      const product = await this.findProduct(manager, productId);
      if (!archived && product.supplier.archived) {
        throw new BadRequestException('The supplier of this product is archived. Restore the supplier first.');
      }
      await manager.getRepository(ProductSchema).update({ id: productId }, { archived });
      await this.stockChangeSubject.notify({ manager }, productId);
      return toProductResponse(await this.findProduct(manager, productId));
    });
  }

  async findProduct(manager, productId) {
    const product = await manager
      .getRepository(ProductSchema)
      .findOne({ where: { id: productId }, relations: { supplier: true } });
    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found.`);
    }
    return product;
  }

  async requireActiveSupplier(manager, supplierId) {
    const supplier = await manager.getRepository(SupplierSchema).findOneBy({ id: supplierId });
    if (!supplier || supplier.archived) {
      throw new BadRequestException('supplierId must refer to an existing, non-archived supplier.');
    }
  }

  async runInTransaction(operation) {
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
