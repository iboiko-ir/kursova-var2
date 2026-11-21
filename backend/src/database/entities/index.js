import { CounterpartySchema } from './counterparty.schema';
import { NotificationSchema } from './notification.schema';
import { ProductSchema } from './product.schema';
import { StockMovementLineSchema } from './stock-movement-line.schema';
import { StockMovementSchema } from './stock-movement.schema';
import { SupplierSchema } from './supplier.schema';
import { UserSchema } from './user.schema';

export {
  CounterpartySchema,
  NotificationSchema,
  ProductSchema,
  StockMovementLineSchema,
  StockMovementSchema,
  SupplierSchema,
  UserSchema,
};

export const entities = [
  UserSchema,
  SupplierSchema,
  CounterpartySchema,
  ProductSchema,
  StockMovementSchema,
  StockMovementLineSchema,
  NotificationSchema,
];
