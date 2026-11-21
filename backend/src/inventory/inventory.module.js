import { Dependencies, Module } from '@nestjs/common';
import { LowStockObserver } from './low-stock.observer';
import { MovementService } from './movement.service';
import { MovementsController } from './movements.controller';
import { StockChangeSubject } from './stock-change.subject';

// Observer pattern: when the application starts, this module subscribes
// LowStockObserver to StockChangeSubject (see the constructor below).
@Module({
  controllers: [MovementsController],
  providers: [StockChangeSubject, LowStockObserver, MovementService],
  exports: [StockChangeSubject, MovementService],
})
@Dependencies(StockChangeSubject, LowStockObserver)
export class InventoryModule {
  constructor(stockChangeSubject, lowStockObserver) {
    stockChangeSubject.subscribe(lowStockObserver);
  }
}
