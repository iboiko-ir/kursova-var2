import { Injectable } from '@nestjs/common';

// Observer pattern: the subject.
// Many places change stock or the minimum stock: the three commands and
// ProductService (create, edit, archive, restore a product). They do not call
// the notification code directly. They only call notify(context, productId).
// The subject then calls every subscribed observer. Now there is one observer,
// LowStockObserver, but new observers can be added without changing the commands.
@Injectable()
export class StockChangeSubject {
  observers = [];

  // InventoryModule subscribes the observers once, when the application starts.
  subscribe(observer) {
    this.observers.push(observer);
  }

  // Each observer is awaited and uses the same transaction (context.manager).
  // If an observer fails, the whole operation is rolled back.
  async notify(context, productId) {
    for (const observer of this.observers) {
      await observer.onStockChanged(context, productId);
    }
  }
}
