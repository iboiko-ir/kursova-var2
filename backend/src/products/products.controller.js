import { Bind, Body, Controller, Dependencies, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @Bind(Body())
  @ParamTypes(CreateProductDto)
  @ApiOperation({
    summary: 'Create a product (admin)',
    description: 'The quantity of a new product is zero. Stock is added only by goods receipts.',
  })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiErrors(400, 401, 403, 409)
  create(dto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @Roles(ROLE_ADMIN)
  @Bind(Param(), Body())
  @ParamTypes(IdParamDto, UpdateProductDto)
  @ApiOperation({ summary: 'Edit a product, including its minimum stock threshold (admin)' })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrors(400, 401, 403, 404, 409)
  update({ id }, dto) {
    return this.productService.update(id, dto);
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
}
