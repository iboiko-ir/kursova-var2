import { BadRequestException } from '@nestjs/common';
import { removeStock } from './ledger';
import { StockCommand } from './stock-command';

// This command writes off goods.
export class WriteOffGoodsCommand extends StockCommand {
  async execute(context, movement) {
    if (!movement.reason) {
      throw new BadRequestException('A reason is required for a write-off.');
    }
    await removeStock(context, movement);
  }
}
