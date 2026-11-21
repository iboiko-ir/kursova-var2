import { Dependencies, Module } from '@nestjs/common';
import { LowStockObserver } from './low-stock.observer';
import { MovementService } from './movement.service';
import { MovementsController } from './movements.controller';
import { StockChangeSubject } from './stock-change.subject';

@Module({
  controllers: [MovementsController],
  providers: [StockChangeSubject, LowStockObserver, MovementService],
  exports: [StockChangeSubject],
})
@Dependencies(StockChangeSubject, LowStockObserver)
export class InventoryModule {
  constructor(subject, lowStockObserver) {
    subject.subscribe(lowStockObserver);
  }
}
