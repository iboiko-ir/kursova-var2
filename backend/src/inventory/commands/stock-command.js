// This is the command contract. Each command changes stock in one movement.
export class StockCommand {
  // context has the transaction manager and the stock change subject.
  async execute(context, movement) {
    throw new Error(`${this.constructor.name} must implement execute`);
  }
}
