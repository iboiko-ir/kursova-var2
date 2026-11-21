import { BadRequestException } from '@nestjs/common';
import { removeStock } from './ledger';
import { StockCommand } from './stock-command';

// Command pattern: the command for a write-off act.
// It checks that a reason is given (for example "Damaged in storage").
// A write-off has no counterparty. Stock is removed like in a shipment.
export class WriteOffGoodsCommand extends StockCommand {
  async execute(context, movement) {
    if (!movement.reason) {
      throw new BadRequestException('A reason is required for a write-off.');
    }
    await removeStock(context, movement);
  }
}
