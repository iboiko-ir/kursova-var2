// Observer pattern: the observer contract.
// An observer has one method: onStockChanged(context, productId).
// The subject calls it after the stock or the minimum stock of a product changes.
export class StockObserver {
  async onStockChanged(context, productId) {
    throw new Error(`${this.constructor.name} must implement onStockChanged`);
  }
}
