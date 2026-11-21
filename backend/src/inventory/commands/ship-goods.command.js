import { BadRequestException } from '@nestjs/common';
import { removeStock } from './ledger';
import { StockCommand } from './stock-command';

// This command ships goods.
export class ShipGoodsCommand extends StockCommand {
  async execute(context, movement) {
    if (!movement.counterparty) {
      throw new BadRequestException('A counterparty is required for a shipment.');
    }
    await removeStock(context, movement);
  }
}
