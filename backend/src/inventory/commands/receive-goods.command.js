import { BadRequestException } from '@nestjs/common';
import { fromUnits, toUnits } from '../money';
import { notifyStockChanged, postLedgerLine, postMovementHeader } from './ledger';
import { StockCommand } from './stock-command';

// This command receives goods.
export class ReceiveGoodsCommand extends StockCommand {
  async execute(context, movement) {
    if (!movement.supplier) {
      throw new BadRequestException('A supplier is required for a receipt.');
    }
    await postMovementHeader(context.manager, movement);
    for (const { product, quantity, unitCost } of movement.lines) {
      const cost = toUnits(unitCost ?? product.catalogPrice);
      await postLedgerLine(context.manager, movement.id, product, {
        quantity,
        unitCost: fromUnits(cost),
        quantityDelta: quantity,
        valueDelta: cost * BigInt(quantity),
      });
    }
    await notifyStockChanged(context, movement);
  }
}
