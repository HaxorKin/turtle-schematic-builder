import { AbstractConstructor } from 'type-fest';
import { memoize } from './memoize-mixin.decorator';

type ClassMapper<I extends AbstractConstructor<unknown>, O extends I> = (Base: I) => O;

export function mixin<I extends AbstractConstructor<unknown>, O extends I>(
  mapClass: ClassMapper<I, O>,
) {
  return (Base: I) => {
    const mixinClass = mapClass(Base);
    Object.defineProperty(mixinClass, 'name', {
      value: mixinClass.name + Base.name,
    });
    return mixinClass;
  };
}

export const memoizedMixin = <I extends AbstractConstructor<unknown>, O extends I>(
  mapClass: ClassMapper<I, O>,
) => memoize(mixin(mapClass));
