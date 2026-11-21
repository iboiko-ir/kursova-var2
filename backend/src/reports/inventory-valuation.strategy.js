import { unitsToMoney, moneyToUnits } from '../inventory/money';
import { ledgerBalances } from './ledger-balances';
import { ReportStrategy } from './report-strategy';

// Strategy pattern: "Financial valuation of stock" report.
// It uses the same ledger sums, keeps only products with stock and adds up
// a grand total of the inventory value on the chosen day.
export class InventoryValuationStrategy extends ReportStrategy {
  constructor(dataSource) {
    super();
    this.dataSource = dataSource;
  }

  async generate({ date }) {
    const balances = await ledgerBalances(this.dataSource, date);
    let total = 0n;
    const items = balances
      .filter((balance) => balance.quantity > 0)
      .map((balance) => {
        const value = moneyToUnits(balance.value);
        total += value;
        return { productId: balance.productId, sku: balance.sku, name: balance.name, quantity: balance.quantity, value: unitsToMoney(value) };
      });
    return { date, items, totalValue: unitsToMoney(total) };
  }
}
