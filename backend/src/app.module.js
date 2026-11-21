import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './config/database';
import { HealthModule } from './health/health.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseOptions()), HealthModule],
})
export class AppModule {}
