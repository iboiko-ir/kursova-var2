// This is the observer contract. An observer reacts when stock changes.
export class StockObserver {
  async onStockChanged(context, productId) {
    throw new Error(`${this.constructor.name} must implement onStockChanged`);
  }
}
