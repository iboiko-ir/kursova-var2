import 'reflect-metadata';

// Plain JavaScript does not emit parameter types. This sets them for ValidationPipe and Swagger.
export const ParamTypes =
  (...types) =>
  (target, key) =>
    Reflect.defineMetadata('design:paramtypes', types, target, key);
