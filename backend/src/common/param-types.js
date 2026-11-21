import 'reflect-metadata';

export const ParamTypes =
  (...types) =>
  (target, key) =>
    Reflect.defineMetadata('design:paramtypes', types, target, key);
