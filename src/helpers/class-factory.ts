import { Constructor } from 'type-fest';

export function classFactory<T extends Constructor<InstanceType<T>>>(
  constructor: T,
): (...args: ConstructorParameters<T>) => InstanceType<T> {
  return (...args) => new constructor(...args);
}
