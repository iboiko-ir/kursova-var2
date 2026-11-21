import { CounterpartySchema } from './counterparty.schema';
import { ProductSchema } from './product.schema';
import { SupplierSchema } from './supplier.schema';
import { UserSchema } from './user.schema';

export { CounterpartySchema, ProductSchema, SupplierSchema, UserSchema };
export const entities = [UserSchema, SupplierSchema, CounterpartySchema, ProductSchema];
