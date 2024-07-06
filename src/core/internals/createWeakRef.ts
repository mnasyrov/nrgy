// `WeakRef` is not always defined in every TS environment where the library is compiled.

/**
 * A `WeakRef`-compatible reference that fakes the API with a strong reference internally.
 */
class LeakyRef<T extends WeakKey> implements WeakRef<T> {
  constructor(private readonly target: T) {}

  get [Symbol.toStringTag]() {
    return 'LeakyRef' as any;
  }

  deref(): T | undefined {
    return this.target;
  }
}

const WeakRefImpl: WeakRefConstructor =
  'WeakRef' in globalThis && globalThis['WeakRef']
    ? globalThis.WeakRef
    : LeakyRef;

export function createWeakRef<T extends object>(value: T): WeakRef<T> {
  return new WeakRefImpl!(value);
}
