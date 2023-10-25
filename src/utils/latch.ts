/**
 * Latch can be used as a point of synchronizing of asynchronous tasks.
 *
 * It is implemented as a promise with exposed `resolve()` and `rejects()` functions.
 */
export type Latch<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export function createLatch<T = void>(): Latch<T> {
  const result = {} as any;

  result.promise = new Promise<T>((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
}
