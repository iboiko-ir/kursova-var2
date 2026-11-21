import { Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryAsOfStrategy } from './inventory-as-of.strategy';
import { InventoryValuationStrategy } from './inventory-valuation.strategy';
import { MovementDynamicsStrategy } from './movement-dynamics.strategy';

// Strategy pattern: this service is the context.
// It keeps the strategies in a fixed list (map) by report name. The controller
// asks for a report by name, and the service calls generate() of that strategy.
// An unknown name is not allowed. A new report needs only a new strategy class
// and one line in this list.
@Injectable()
@Dependencies(DataSource)
export class ReportService {
  constructor(dataSource) {
    this.strategies = new Map([
      ['inventory-as-of', new InventoryAsOfStrategy(dataSource)],
      ['movement-dynamics', new MovementDynamicsStrategy(dataSource)],
      ['inventory-valuation', new InventoryValuationStrategy(dataSource)],
    ]);
  }

  generate(name, params) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new NotFoundException(`Report ${name} does not exist.`);
    }
    return strategy.generate(params);
  }
}
