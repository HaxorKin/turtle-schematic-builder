import { WeakrefMap } from '../weakrefmap';

export function memoize<F extends (key: never) => object>(fn: F): F {
  const cache = new WeakrefMap<unknown, object>();

  return function (this: ThisParameterType<F>, key: Parameters<F>[0]): object {
    const cachedValue = cache.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    // eslint-disable-next-line prefer-rest-params
    const value = fn.apply(this, arguments as unknown as Parameters<F>);
    cache.set(key, value);
    return value;
  } as F;
}
