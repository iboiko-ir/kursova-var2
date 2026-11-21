import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CounterpartySchema, SupplierSchema } from '../database/entities';
import { CounterpartiesController } from './counterparties.controller';
import { COUNTERPARTY_SERVICE, SUPPLIER_SERVICE } from './parties.tokens';
import { PartyService } from './party.service';
import { SuppliersController } from './suppliers.controller';

@Module({
  controllers: [SuppliersController, CounterpartiesController],
  providers: [
    {
      provide: SUPPLIER_SERVICE,
      useFactory: (dataSource) => new PartyService(dataSource, SupplierSchema, 'Supplier', [
          { tableName: 'products', columnName: 'supplier_id', description: 'products' },
          { tableName: 'stock_movements', columnName: 'supplier_id', description: 'posted documents' },
        ]),
      inject: [DataSource],
    },
    {
      provide: COUNTERPARTY_SERVICE,
      useFactory: (dataSource) => new PartyService(dataSource, CounterpartySchema, 'Counterparty', [
          { tableName: 'stock_movements', columnName: 'counterparty_id', description: 'posted documents' },
        ]),
      inject: [DataSource],
    },
  ],
  exports: [SUPPLIER_SERVICE, COUNTERPARTY_SERVICE],
})
export class PartiesModule {}
