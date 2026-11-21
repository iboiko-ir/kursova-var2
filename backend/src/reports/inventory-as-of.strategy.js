import { unitsToMoney, multiplyThenDivide, moneyToUnits } from '../inventory/money';
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
    const items = balances.map((balance) => {
      const value = moneyToUnits(balance.value);
      return {
        productId: balance.productId,
        sku: balance.sku,
        name: balance.name,
        quantity: balance.quantity,
        unitCost: balance.quantity > 0 ? unitsToMoney(multiplyThenDivide(value, 1n, BigInt(balance.quantity))) : unitsToMoney(0n),
        value: unitsToMoney(value),
      };
    });
    return { date, items };
  }
}
