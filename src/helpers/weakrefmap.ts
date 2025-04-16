/**
 * A Map implementation that holds values in WeakRefs and automatically
 * cleans up entries when values are garbage collected.
 */
export class WeakrefMap<K, V extends object> implements Map<K, V> {
  readonly [Symbol.toStringTag] = 'WeakrefMap';

  private readonly map = new Map<K, WeakRef<V>>();
  private readonly registry = new FinalizationRegistry<K>((key) => {
    this.map.delete(key);
  });

  get size(): number {
    return this.map.size;
  }

  set(key: K, value: V): this {
    // Remove any existing registry for this key
    const existingRef = this.map.get(key);
    if (existingRef) {
      const existingValue = existingRef.deref();
      if (existingValue) {
        if (existingValue === value) return this; // No change

        this.registry.unregister(existingValue);
      }
    }

    // Create a new weak reference and register for finalization
    const ref = new WeakRef(value);
    this.map.set(key, ref);
    this.registry.register(value, key);

    return this;
  }

  get(key: K): V | undefined {
    return this.map.get(key)?.deref();
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const ref = this.map.get(key);
    if (!ref) return false;

    const value = ref.deref();
    if (value) {
      this.registry.unregister(value);
    }

    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  keys() {
    return this.map.keys();
  }

  *entries(): MapIterator<[K, V]> {
    for (const [key, ref] of this.map.entries()) {
      const value = ref.deref();
      if (value !== undefined) {
        yield [key, value];
      }
    }
  }

  *values(): MapIterator<V> {
    for (const ref of this.map.values()) {
      const value = ref.deref();
      if (value !== undefined) {
        yield value;
      }
    }
  }

  forEach<This = undefined>(
    callbackfn: (this: This, value: V, key: K, map: this) => void,
    thisArg?: This,
  ): void;
  forEach<This = undefined>(
    callbackfn: (this: This, value: V, key: K, map: this) => void,
    thisArg: This,
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
}
