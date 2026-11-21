import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { databaseOptions } from './config/database';
import { HealthModule } from './health/health.module';
import { PartiesModule } from './parties/parties.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseOptions()), AuthModule, HealthModule, PartiesModule, ProductsModule],
})
export class AppModule {}
