import { BadRequestException } from '@nestjs/common';
import { removeStock } from './ledger';
import { StockCommand } from './stock-command';

// Command pattern: the command for a shipment to a counterparty.
// It checks that a counterparty is set. Then removeStock() checks that there is
// enough stock, saves the document and removes goods at the average cost.
export class ShipGoodsCommand extends StockCommand {
  async execute(context, movement) {
    if (!movement.counterparty) {
      throw new BadRequestException('A counterparty is required for a shipment.');
    }
    await removeStock(context, movement);
  }
}
