type QueueEntry<T> = { item: T; next?: QueueEntry<T> };

export type Queue<T> = Readonly<{
  isEmpty(): boolean;
  get(): T | undefined;
  add(item: T): void;
}>;

/**
 * Queue based on a linked list
 */
export function createQueue<T>(): Queue<T> {
  let head: QueueEntry<T> | undefined;
  let tail: QueueEntry<T> | undefined;

  return {
    isEmpty(): boolean {
      return !head;
    },

    get(): T | undefined {
      const entry = head;

      if (entry) {
        const next = (head = entry.next);
        if (!next) tail = undefined;

        return entry.item;
      }

      return undefined;
    },

    add(item: T): void {
      const entry: QueueEntry<T> = { item };

      if (tail) {
        tail.next = entry;
      } else {
        head = entry;
      }

      tail = entry;
    },
  };
}
