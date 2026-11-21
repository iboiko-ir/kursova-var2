import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}
