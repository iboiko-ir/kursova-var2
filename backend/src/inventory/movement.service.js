import { BadRequestException, Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { parseUtcDay } from '../common/dates';
import { ReceiveGoodsCommand } from './commands/receive-goods.command';
import { ShipGoodsCommand } from './commands/ship-goods.command';
import { WriteOffGoodsCommand } from './commands/write-off-goods.command';
import { moneyToUnits, unitsToMoney } from './money';
import { StockChangeSubject } from './stock-change.subject';

const FORBIDDEN_FIELDS = {
  receipt: ['counterpartyId', 'reason'],
  shipment: ['supplierId', 'reason'],
  write_off: ['supplierId', 'counterpartyId'],
};

const PARTY_TABLES = {
  supplier: { tableName: 'suppliers', label: 'Supplier' },
  counterparty: { tableName: 'counterparties', label: 'Counterparty' },
};

function toPartySnapshot(id, name, contactDetails) {
  return id ? { id, name, contactDetails } : null;
}

// Command pattern: this service is the invoker.
// post() opens one database transaction. Inside it, the service checks the
// request, loads the supplier or counterparty, locks the product rows and then
// picks the command by the document type and calls execute().
// The service does not know how each document changes stock. The commands do.
// If a command throws an error, the transaction is rolled back: no document,
// no stock change and no notification change is saved.
@Injectable()
@Dependencies(DataSource, StockChangeSubject)
export class MovementService {
  constructor(dataSource, stockChangeSubject) {
    this.dataSource = dataSource;
    this.stockChangeSubject = stockChangeSubject;
    this.commandsByType = {
      receipt: new ReceiveGoodsCommand(),
      shipment: new ShipGoodsCommand(),
      write_off: new WriteOffGoodsCommand(),
    };
  }

  async post(newMovement, user) {
    const movementId = await this.dataSource.transaction((manager) =>
      this.postInTransaction(manager, newMovement, user),
    );
    return this.get(movementId);
  }

  async postInTransaction(manager, newMovement, user) {
    this.validateMovement(newMovement);
    const supplier = await this.loadParty(manager, 'supplier', newMovement.supplierId);
    const counterparty = await this.loadParty(manager, 'counterparty', newMovement.counterpartyId);
    const lockedProducts = await this.lockProducts(manager, newMovement.lines);
    const movement = {
      type: newMovement.type,
      supplier,
      counterparty,
      reason: newMovement.reason,
      user,
      lines: newMovement.lines.map((line) => ({
        product: lockedProducts.get(line.productId),
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
    };
    const command = this.commandsByType[newMovement.type];
    await command.execute({ manager, subject: this.stockChangeSubject }, movement);
    return movement.id;
  }

  validateMovement(newMovement) {
    for (const field of FORBIDDEN_FIELDS[newMovement.type]) {
      if (newMovement[field] !== undefined) {
        throw new BadRequestException(`${field} is not allowed for movement type ${newMovement.type}.`);
      }
    }
    if (newMovement.type !== 'receipt' && newMovement.lines.some((line) => line.unitCost !== undefined)) {
      throw new BadRequestException('unitCost is allowed only for receipts.');
    }
    const seenProductIds = new Set();
    for (const { productId } of newMovement.lines) {
      if (seenProductIds.has(productId)) {
        throw new BadRequestException(`Product ${productId} appears in more than one line.`);
      }
      seenProductIds.add(productId);
    }
  }

  async loadParty(manager, partyKind, partyId) {
    if (partyId === undefined) {
      return null;
    }
    const { tableName, label } = PARTY_TABLES[partyKind];
    const [party] = await manager.query(
      `SELECT id, name, contact_details AS "contactDetails", archived FROM ${tableName} WHERE id = $1`,
      [partyId],
    );
    if (!party || party.archived) {
      throw new BadRequestException(`${label} ${partyId} does not exist or is archived.`);
    }
    return party;
  }

  // Product rows are locked (SELECT ... FOR UPDATE) until the transaction ends,
  // so two users cannot ship the same goods at the same time.
  // The rows are locked in ID order, so two documents never wait for each other forever.
  async lockProducts(manager, lines) {
    const lockedProducts = new Map();
    const sortedProductIds = lines
      .map((line) => line.productId)
      .sort((firstId, secondId) => firstId - secondId);
    for (const productId of sortedProductIds) {
      const [product] = await manager.query(
        `SELECT id, name, sku, quantity, inventory_value AS "inventoryValue",
                catalog_price AS "catalogPrice", archived
         FROM products WHERE id = $1 FOR UPDATE`,
        [productId],
      );
      if (!product || product.archived) {
        throw new BadRequestException(`Product ${productId} does not exist or is archived.`);
      }
      lockedProducts.set(productId, product);
    }
    return lockedProducts;
  }

  async list({ page, limit, type, productId, dateFrom, dateTo, search }) {
    const conditions = [];
    const queryParameters = [];
    const addCondition = (conditionSql, parameterValue) => {
      queryParameters.push(parameterValue);
      conditions.push(conditionSql.replace('?', `$${queryParameters.length}`));
    };

    if (type) {
      addCondition('movement.type = ?', type);
    }
    if (productId) {
      addCondition(
        `EXISTS (SELECT 1 FROM stock_movement_lines line
                 WHERE line.movement_id = movement.id AND line.product_id = ?)`,
        productId,
      );
    }
    const firstDay = dateFrom ? parseUtcDay(dateFrom, 'dateFrom') : null;
    const lastDay = dateTo ? parseUtcDay(dateTo, 'dateTo') : null;
    if (firstDay && lastDay && firstDay > lastDay) {
      throw new BadRequestException('dateFrom must not be later than dateTo.');
    }
    if (firstDay) {
      addCondition('movement.posted_at >= ?::timestamptz', firstDay.toISOString());
    }
    if (lastDay) {
      addCondition("movement.posted_at < ?::timestamptz + interval '24 hours'", lastDay.toISOString());
    }
    if (search) {
      const escapedSearch = search.replace(/[\\%_]/g, (character) => `\\${character}`);
      addCondition("movement.number ILIKE ? ESCAPE '\\'", `%${escapedSearch}%`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM stock_movements movement ${whereClause}`,
      queryParameters,
    );
    const movements = await this.dataSource.query(
      `SELECT movement.id, movement.number, movement.type, movement.posted_at AS "postedAt",
              COALESCE(movement.supplier_name, movement.counterparty_name) AS "partyName",
              movement.reason, movement.created_by_name AS "createdBy",
              (SELECT count(*)::int FROM stock_movement_lines line WHERE line.movement_id = movement.id)
                AS "lineCount",
              (SELECT COALESCE(sum(abs(line.value_delta)), 0)
               FROM stock_movement_lines line WHERE line.movement_id = movement.id) AS "totalValue"
       FROM stock_movements movement ${whereClause}
       ORDER BY movement.posted_at DESC, movement.id DESC
       LIMIT $${queryParameters.length + 1} OFFSET $${queryParameters.length + 2}`,
      [...queryParameters, limit, (page - 1) * limit],
    );
    return { items: movements, total, page, limit };
  }

  async get(movementId) {
    const [movement] = await this.dataSource.query(
      `SELECT id, number, type, posted_at AS "postedAt",
              supplier_id AS "supplierId", supplier_name AS "supplierName", supplier_details AS "supplierDetails",
              counterparty_id AS "counterpartyId", counterparty_name AS "counterpartyName",
              counterparty_details AS "counterpartyDetails",
              reason, created_by_name AS "createdBy"
       FROM stock_movements WHERE id = $1`,
      [movementId],
    );
    if (!movement) {
      throw new NotFoundException(`Movement ${movementId} was not found.`);
    }
    const ledgerLines = await this.dataSource.query(
      `SELECT product_id AS "productId", sku, product_name AS "productName", quantity,
              unit_cost AS "unitCost", quantity_delta AS "quantityDelta", value_delta AS "valueDelta"
       FROM stock_movement_lines WHERE movement_id = $1 ORDER BY id`,
      [movementId],
    );

    let totalValueUnits = 0n;
    const lines = ledgerLines.map((line) => {
      const signedValueUnits = moneyToUnits(line.valueDelta);
      const valueUnits = signedValueUnits < 0n ? -signedValueUnits : signedValueUnits;
      totalValueUnits += valueUnits;
      return { ...line, value: unitsToMoney(valueUnits) };
    });

    return {
      id: movement.id,
      number: movement.number,
      type: movement.type,
      postedAt: movement.postedAt,
      supplier: toPartySnapshot(movement.supplierId, movement.supplierName, movement.supplierDetails),
      counterparty: toPartySnapshot(movement.counterpartyId, movement.counterpartyName, movement.counterpartyDetails),
      reason: movement.reason,
      createdBy: movement.createdBy,
      lines,
      totalValue: unitsToMoney(totalValueUnits),
    };
  }
}
