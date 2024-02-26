// `WeakMap` is not always defined in every TS environment where the library is compiled.

/**
 * A `WeakMap`-compatible reference that fakes the API with a strong reference internally.
 */
class LeakyMap<K extends WeakKey, V> implements WeakMap<K, V> {
  get [Symbol.toStringTag]() {
    return 'LeakyMap' as any;
  }

  private map = new Map<K, V>();

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  set(key: K, value: V): this {
    this.map.set(key, value);
    return this;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }
}

const WeakMapImpl: WeakMapConstructor =
  'WeakMap' in globalThis && globalThis['WeakMap']
    ? globalThis.WeakMap
    : LeakyMap;

export function createWeakMap<K extends WeakKey, V>(): WeakMap<K, V> {
  return new WeakMapImpl!();
}
