import { fromUnits, toUnits } from '../inventory/money';
import { ledgerBalances } from './ledger-balances';
import { ReportStrategy } from './report-strategy';

// This strategy adds up the value of stock.
export class InventoryValuationStrategy extends ReportStrategy {
  constructor(dataSource) {
    super();
    this.dataSource = dataSource;
  }

  async generate({ date }) {
    const balances = await ledgerBalances(this.dataSource, date);
    let total = 0n;
    const items = balances
      .filter((row) => row.quantity > 0)
      .map((row) => {
        const value = toUnits(row.value);
        total += value;
        return { productId: row.productId, sku: row.sku, name: row.name, quantity: row.quantity, value: fromUnits(value) };
      });
    return { date, items, totalValue: fromUnits(total) };
  }
}
