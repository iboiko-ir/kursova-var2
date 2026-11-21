import { BadRequestException, Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReceiveGoodsCommand } from './commands/receive-goods.command';
import { ShipGoodsCommand } from './commands/ship-goods.command';
import { WriteOffGoodsCommand } from './commands/write-off-goods.command';
import { fromUnits, toUnits } from './money';
import { StockChangeSubject } from './stock-change.subject';

const FORBIDDEN_FIELDS = {
  receipt: ['counterpartyId', 'reason'],
  shipment: ['supplierId', 'reason'],
  write_off: ['supplierId', 'counterpartyId'],
};

const PARTY_TABLES = {
  supplier: { table: 'suppliers', label: 'Supplier' },
  counterparty: { table: 'counterparties', label: 'Counterparty' },
};

function parseUtcDay(text, field) {
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new BadRequestException(`${field} is not a valid date.`);
  }
  return date;
}

// This service is the invoker. It picks a command and runs it in one transaction.
@Injectable()
@Dependencies(DataSource, StockChangeSubject)
export class MovementService {
  constructor(dataSource, subject) {
    this.dataSource = dataSource;
    this.subject = subject;
    this.commands = {
      receipt: new ReceiveGoodsCommand(),
      shipment: new ShipGoodsCommand(),
      write_off: new WriteOffGoodsCommand(),
    };
  }

  async post(input, user) {
    this.checkShape(input);
    const result = await this.dataSource.transaction(async (manager) => {
      const supplier = await this.loadParty(manager, 'supplier', input.supplierId);
      const counterparty = await this.loadParty(manager, 'counterparty', input.counterpartyId);
      const products = await this.lockProducts(manager, input.lines);
      const movement = {
        type: input.type,
        supplier,
        counterparty,
        reason: input.reason,
        user,
        lines: input.lines.map((line) => ({
          product: products.get(line.productId),
          quantity: line.quantity,
          unitCost: line.unitCost,
        })),
      };
      await this.commands[input.type].execute({ manager, subject: this.subject }, movement);
      return movement.id;
    });
    return this.get(result);
  }

  checkShape(input) {
    for (const field of FORBIDDEN_FIELDS[input.type]) {
      if (input[field] !== undefined) {
        throw new BadRequestException(`${field} is not allowed for movement type ${input.type}.`);
      }
    }
    if (input.type !== 'receipt' && input.lines.some((line) => line.unitCost !== undefined)) {
      throw new BadRequestException('unitCost is allowed only for receipts.');
    }
    const seen = new Set();
    for (const { productId } of input.lines) {
      if (seen.has(productId)) {
        throw new BadRequestException(`Product ${productId} appears in more than one line.`);
      }
      seen.add(productId);
    }
  }

  async loadParty(manager, kind, id) {
    if (id === undefined) {
      return null;
    }
    const { table, label } = PARTY_TABLES[kind];
    const [party] = await manager.query(
      `SELECT id, name, contact_details AS "contactDetails", archived FROM ${table} WHERE id = $1`,
      [id],
    );
    if (!party || party.archived) {
      throw new BadRequestException(`${label} ${id} does not exist or is archived.`);
    }
    return party;
  }

  // Product rows are locked in ID order, so two documents cannot block each other.
  async lockProducts(manager, lines) {
    const products = new Map();
    const ids = lines.map((line) => line.productId).sort((a, b) => a - b);
    for (const id of ids) {
      const [product] = await manager.query(
        `SELECT id, name, sku, quantity, inventory_value AS "inventoryValue",
                catalog_price AS "catalogPrice", archived
         FROM products WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (!product || product.archived) {
        throw new BadRequestException(`Product ${id} does not exist or is archived.`);
      }
      products.set(id, product);
    }
    return products;
  }

  async list({ page, limit, type, productId, dateFrom, dateTo, search }) {
    const conditions = [];
    const params = [];
    const add = (sql, value) => {
      params.push(value);
      conditions.push(sql.replace('?', `$${params.length}`));
    };
    if (type) {
      add('m.type = ?', type);
    }
    if (productId) {
      add('EXISTS (SELECT 1 FROM stock_movement_lines f WHERE f.movement_id = m.id AND f.product_id = ?)', productId);
    }
    const from = dateFrom ? parseUtcDay(dateFrom, 'dateFrom') : null;
    const to = dateTo ? parseUtcDay(dateTo, 'dateTo') : null;
    if (from && to && from > to) {
      throw new BadRequestException('dateFrom must not be later than dateTo.');
    }
    if (from) {
      add('m.posted_at >= ?::timestamptz', from.toISOString());
    }
    if (to) {
      add("m.posted_at < ?::timestamptz + interval '24 hours'", to.toISOString());
    }
    if (search) {
      add("m.number ILIKE ? ESCAPE '\\'", `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM stock_movements m ${where}`,
      params,
    );
    const items = await this.dataSource.query(
      `SELECT m.id, m.number, m.type, m.posted_at AS "postedAt",
              COALESCE(m.supplier_name, m.counterparty_name) AS "partyName",
              m.reason, m.created_by_name AS "createdBy",
              (SELECT count(*)::int FROM stock_movement_lines l WHERE l.movement_id = m.id) AS "lineCount",
              (SELECT COALESCE(sum(abs(l.value_delta)), 0) FROM stock_movement_lines l WHERE l.movement_id = m.id)
                AS "totalValue"
       FROM stock_movements m ${where}
       ORDER BY m.posted_at DESC, m.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    );
    return { items, total, page, limit };
  }

  async get(id) {
    const [movement] = await this.dataSource.query(
      `SELECT id, number, type, posted_at AS "postedAt",
              supplier_id AS "supplierId", supplier_name AS "supplierName", supplier_details AS "supplierDetails",
              counterparty_id AS "counterpartyId", counterparty_name AS "counterpartyName",
              counterparty_details AS "counterpartyDetails",
              reason, created_by_name AS "createdBy"
       FROM stock_movements WHERE id = $1`,
      [id],
    );
    if (!movement) {
      throw new NotFoundException(`Movement ${id} was not found.`);
    }
    const lines = await this.dataSource.query(
      `SELECT product_id AS "productId", sku, product_name AS "productName", quantity,
              unit_cost AS "unitCost", quantity_delta AS "quantityDelta", value_delta AS "valueDelta"
       FROM stock_movement_lines WHERE movement_id = $1 ORDER BY id`,
      [id],
    );
    let total = 0n;
    const responseLines = lines.map((line) => {
      const value = toUnits(line.valueDelta);
      total += value < 0n ? -value : value;
      return { ...line, value: fromUnits(value < 0n ? -value : value) };
    });
    const party = (prefix) =>
      movement[`${prefix}Id`]
        ? {
            id: movement[`${prefix}Id`],
            name: movement[`${prefix}Name`],
            contactDetails: movement[`${prefix}Details`],
          }
        : null;
    return {
      id: movement.id,
      number: movement.number,
      type: movement.type,
      postedAt: movement.postedAt,
      supplier: party('supplier'),
      counterparty: party('counterparty'),
      reason: movement.reason,
      createdBy: movement.createdBy,
      lines: responseLines,
      totalValue: fromUnits(total),
    };
  }
}
