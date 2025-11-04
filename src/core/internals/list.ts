/** @internal */
export type ListItem<T> = T & { next?: ListItem<T> };

/** @internal */
export type ListEntry<T> = { value: T; next?: ListEntry<T> };

export type LinkedList<T> = {
  head?: ListEntry<T>;
  tail?: ListEntry<T>;
};

/** @internal */
export function cloneListPointer<T>(list: LinkedList<T>): LinkedList<T> {
  return {
    head: list.head,
    tail: list.tail,
  };
}

/** @internal */
export function isEmptyList<T>(list: LinkedList<T>): boolean {
  return !list.head;
}

/** @internal */
export function clearList<T>(list: LinkedList<T>): void {
  list.head = undefined;
  list.tail = undefined;
}

/** @internal */
export function addToListHead<T>(list: LinkedList<T>, value: T): void {
  const node = { value, next: list.head };
  list.head = node;
  if (!list.tail) {
    list.tail = node;
  }
}

/** @internal */
export function appendToList<T>(list: LinkedList<T>, value: T): void {
  const node = { value };
  if (list.tail) list.tail.next = node;
  list.tail = node;
  if (!list.head) list.head = node;
}

/** @internal */
export function forEachInList<T>(
  list: LinkedList<T>,
  fn: (value: T) => void,
): void {
  let node = list.head;
  while (node) {
    fn(node.value);
    node = node.next;
  }
}

/** @internal */
export function popListHead<T>(list: LinkedList<T>): T | undefined {
  const entry = list.head;

  if (entry) {
    const next = (list.head = entry.next);
    if (!next) list.tail = undefined;

    return entry.value;
  }

  return undefined;
}
