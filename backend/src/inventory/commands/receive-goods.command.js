import { BadRequestException } from '@nestjs/common';
import { unitsToMoney, moneyToUnits } from '../money';
import { notifyStockChanged, postLedgerLine, postMovementHeader } from './ledger';
import { StockCommand } from './stock-command';

// Command pattern: the command for a goods receipt.
// It checks that a supplier is set, saves the document header and adds stock.
// Each line adds "quantity x unit cost" to the product value. If the unit cost is
// not given, the catalog price is used. Then the subject is notified, so the
// low-stock observer can resolve a notification when there is enough stock now.
export class ReceiveGoodsCommand extends StockCommand {
  async execute(context, movement) {
    if (!movement.supplier) {
      throw new BadRequestException('A supplier is required for a receipt.');
    }
    await postMovementHeader(context.manager, movement);
    for (const { product, quantity, unitCost } of movement.lines) {
      const cost = moneyToUnits(unitCost ?? product.catalogPrice);
      await postLedgerLine(context.manager, movement.id, product, {
        quantity,
        unitCost: unitsToMoney(cost),
        quantityDelta: quantity,
        valueDelta: cost * BigInt(quantity),
      });
    }
    await notifyStockChanged(context, movement);
  }
}
