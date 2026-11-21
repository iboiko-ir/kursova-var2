import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './config/database';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PartiesModule } from './parties/parties.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    AuthModule,
    HealthModule,
    PartiesModule,
    ProductsModule,
    InventoryModule,
    NotificationsModule,
    ReportsModule,
    UsersModule,
  ],
})
export class AppModule {}
