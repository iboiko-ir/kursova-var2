import { Dependencies, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryAsOfStrategy } from './inventory-as-of.strategy';
import { InventoryValuationStrategy } from './inventory-valuation.strategy';
import { MovementDynamicsStrategy } from './movement-dynamics.strategy';

// This service is the context. It picks a strategy from a short list.
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
