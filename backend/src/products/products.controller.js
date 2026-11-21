import { Bind, Body, Controller, Delete, Dependencies, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE_ADMIN, Roles } from '../auth/decorators';
import { ApiErrors } from '../common/api-errors';
import { ParamTypes } from '../common/param-types';
import { IdParamDto } from '../common/id-param.dto';
import { pageOf } from '../common/page';
import { CreateProductDto, ProductDto, ProductQueryDto, UpdateProductDto } from './product.dto';
import { ProductService } from './product.service';

const ProductPage = pageOf(ProductDto, 'ProductPage');

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@Dependencies(ProductService)
export class ProductsController {
  constructor(productService) {
    this.productService = productService;
  }

  @Get()
  @Bind(Query())
  @ParamTypes(ProductQueryDto)
  @ApiOperation({ summary: 'List products', description: 'Supports search by name or SKU, a supplier filter and pagination.' })
  @ApiOkResponse({ type: ProductPage })
  @ApiErrors(400, 401)
  list(query) {
    return this.productService.list(query);
  }

  @Get(':id')
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Get a product' })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrors(400, 401, 404)
  get({ id }) {
    return this.productService.get(id);
  }

  @Post()
  @Roles(ROLE_ADMIN)
  @Bind(Body(), Req())
  @ParamTypes(CreateProductDto, Object)
  @ApiOperation({
    summary: 'Create a product (admin)',
    description:
      'The quantity of a new product is zero unless initialQuantity is given. Initial stock is recorded as a goods receipt in the same transaction. Later stock changes are made only by movements.',
  })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiErrors(400, 401, 403, 409)
  create(newProduct, request) {
    return this.productService.create(newProduct, request.user);
  }

  @Patch(':id')
  @Roles(ROLE_ADMIN)
  @Bind(Param(), Body())
  @ParamTypes(IdParamDto, UpdateProductDto)
  @ApiOperation({ summary: 'Edit a product, including its minimum stock threshold (admin)' })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrors(400, 401, 403, 404, 409)
  update({ id }, changes) {
    return this.productService.update(id, changes);
  }

  @Post(':id/archive')
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({
    summary: 'Archive a product (admin)',
    description: 'Archived products are hidden from new movement forms. History is kept.',
  })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiErrors(400, 401, 403, 404)
  archive({ id }) {
    return this.productService.setArchived(id, true);
  }

  @Post(':id/restore')
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Restore an archived product (admin)' })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiErrors(400, 401, 403, 404)
  restore({ id }) {
    return this.productService.setArchived(id, false);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(ROLE_ADMIN)
  @Bind(Param())
  @ParamTypes(IdParamDto)
  @ApiOperation({ summary: 'Delete a product (admin)', description: 'Only a product without stock movements can be deleted. Otherwise archive it.' })
  @ApiNoContentResponse({ description: 'The record was deleted.' })
  @ApiErrors(400, 401, 403, 404, 409)
  delete({ id }) {
    return this.productService.delete(id);
  }
}
