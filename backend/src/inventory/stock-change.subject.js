import { Injectable } from '@nestjs/common';

// This subject tells its observers that stock changed.
@Injectable()
export class StockChangeSubject {
  observers = [];

  // Observers are added once, when the module starts.
  subscribe(observer) {
    this.observers.push(observer);
  }

  // This waits for each observer, in the same transaction.
  async notify(context, productId) {
    for (const observer of this.observers) {
      await observer.onStockChanged(context, productId);
    }
  }
}
