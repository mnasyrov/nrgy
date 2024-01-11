// `WeakRef` is not always defined in every TS environment where the library is compiled.

/**
 * A `WeakRef`-compatible reference that fakes the API with a strong reference internally.
 */
class LeakyRef<T extends WeakKey> implements WeakRef<T> {
  constructor(private readonly ref: T) {}

  get [Symbol.toStringTag]() {
    return 'LeakyRef' as any;
  }

  deref(): T | undefined {
    return this.ref;
  }
}

const WeakRefImpl: typeof WeakRef =
  'WeakRef' in globalThis ? globalThis.WeakRef : LeakyRef;

export function createWeakRef<T extends object>(value: T): WeakRef<T> {
  return new WeakRefImpl!(value);
}
