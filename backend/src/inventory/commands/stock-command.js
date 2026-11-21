// Command pattern: the command contract.
//
// The warehouse has three kinds of documents: goods receipt, shipment and write-off.
// Each kind is one command class with the same method: execute(context, movement).
// The command knows the rules of its own document. For example, a receipt needs
// a supplier, a shipment needs a counterparty and enough stock.
//
// MovementService (the invoker) does not know these rules. It only opens a
// transaction, locks the products and calls execute() on the right command.
// So a new document type needs a new command class, not a big if/else block.
export class StockCommand {
  // context.manager is the database transaction. All changes use it, so if one
  // line fails, the whole document is cancelled.
  // context.subject is the stock change subject (Observer pattern). A command
  // calls it after stock changes, so low-stock notifications are updated.
  // movement has the document type, party, reason, user and lines.
  async execute(context, movement) {
    throw new Error(`${this.constructor.name} must implement execute`);
  }
}
