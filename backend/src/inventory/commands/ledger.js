import { ConflictException } from '@nestjs/common';
import { unitsToMoney, multiplyThenDivide, moneyToUnits } from '../money';

const DOCUMENT_NUMBERING = {
  receipt: ['movement_receipt_seq', 'RN'],
  shipment: ['movement_shipment_seq', 'SN'],
  write_off: ['movement_write_off_seq', 'WO'],
};

export async function postMovementHeader(manager, movement) {
  const [sequence, prefix] = DOCUMENT_NUMBERING[movement.type];
  const [{ next }] = await manager.query(`SELECT nextval('${sequence}') AS next`);
  const number = `${prefix}-${String(next).padStart(6, '0')}`;
  const { supplier, counterparty, user } = movement;
  const [insertedMovement] = await manager.query(
    `INSERT INTO stock_movements
       (number, type, supplier_id, supplier_name, supplier_details,
        counterparty_id, counterparty_name, counterparty_details, reason, created_by_id, created_by_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      number,
      movement.type,
      supplier ? supplier.id : null,
      supplier ? supplier.name : null,
      supplier ? supplier.contactDetails : null,
      counterparty ? counterparty.id : null,
      counterparty ? counterparty.name : null,
      counterparty ? counterparty.contactDetails : null,
      movement.reason || null,
      user.id,
      user.username,
    ],
  );
  movement.id = insertedMovement.id;
  movement.number = number;
}

export async function postLedgerLine(manager, movementId, product, { quantity, unitCost, quantityDelta, valueDelta }) {
  const newQuantity = product.quantity + quantityDelta;
  const newValue = moneyToUnits(product.inventoryValue) + valueDelta;
  await manager.query('UPDATE products SET quantity = $2, inventory_value = $3, updated_at = now() WHERE id = $1', [
    product.id,
    newQuantity,
    unitsToMoney(newValue),
  ]);
  await manager.query(
    `INSERT INTO stock_movement_lines
       (movement_id, product_id, product_name, sku, quantity, unit_cost, quantity_delta, value_delta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [movementId, product.id, product.name, product.sku, quantity, unitCost, quantityDelta, unitsToMoney(valueDelta)],
  );
}

export async function notifyStockChanged(context, movement) {
  for (const { product } of movement.lines) {
    await context.subject.notify(context, product.id);
  }
}

// Command pattern: shared work of the shipment and write-off commands.
// Goods leave the warehouse at the weighted-average cost:
// value out = product value x quantity out / product quantity.
// When the last units leave, they take all remaining value, so a product with
// zero quantity never keeps a small value after rounding.
// If one line asks for more than the stock, an error stops the whole document.
export async function removeStock(context, movement) {
  for (const { product, quantity } of movement.lines) {
    if (quantity > product.quantity) {
      throw new ConflictException(
        `Insufficient stock for ${product.sku}: requested ${quantity}, available ${product.quantity}.`,
      );
    }
  }
  await postMovementHeader(context.manager, movement);
  for (const { product, quantity } of movement.lines) {
    const value = moneyToUnits(product.inventoryValue);
    const valueOut = quantity === product.quantity ? value : multiplyThenDivide(value, BigInt(quantity), BigInt(product.quantity));
    await postLedgerLine(context.manager, movement.id, product, {
      quantity,
      unitCost: unitsToMoney(multiplyThenDivide(value, 1n, BigInt(product.quantity))),
      quantityDelta: -quantity,
      valueDelta: -valueOut,
    });
  }
  await notifyStockChanged(context, movement);
}
