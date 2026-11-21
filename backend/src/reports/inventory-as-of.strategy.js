import { fromUnits, mulDivRound, toUnits } from '../inventory/money';
import { ledgerBalances } from './ledger-balances';
import { ReportStrategy } from './report-strategy';

// This strategy shows stock on one date.
export class InventoryAsOfStrategy extends ReportStrategy {
  constructor(dataSource) {
    super();
    this.dataSource = dataSource;
  }

  async generate({ date }) {
    const balances = await ledgerBalances(this.dataSource, date);
    const items = balances.map((row) => {
      const value = toUnits(row.value);
      return {
        productId: row.productId,
        sku: row.sku,
        name: row.name,
        quantity: row.quantity,
        unitCost: row.quantity > 0 ? fromUnits(mulDivRound(value, 1n, BigInt(row.quantity))) : fromUnits(0n),
        value: fromUnits(value),
      };
    });
    return { date, items };
  }
}
