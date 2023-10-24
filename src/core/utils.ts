export function nextSafeInteger(currentValue: number): number {
  return currentValue < Number.MAX_SAFE_INTEGER
    ? currentValue + 1
    : Number.MIN_SAFE_INTEGER;
}

export function isArrayEqual(
  a: ReadonlyArray<unknown>,
  b: ReadonlyArray<unknown>,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

export type Latch<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
};

export function createLatch<T = void>(): Latch<T> {
  const result = {} as any;

  result.promise = new Promise<T>((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
}

export type QueueEntry<T> = { item: T; next?: QueueEntry<T> };

export class Queue<T> {
  head: QueueEntry<T> | undefined;
  tail: QueueEntry<T> | undefined;

  push(item: T) {
    const entry = { item };

    if (this.tail) {
      this.tail.next = entry;
    } else {
      this.head = entry;
    }

    this.tail = entry;
  }

  get(): T | undefined {
    const entry = this.head;

    if (entry) {
      const next = (this.head = entry.next);
      if (!next) this.tail = undefined;

      return entry.item;
    }

    return undefined;
  }
}
