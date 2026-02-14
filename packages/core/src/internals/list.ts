/** @internal */
export type ListItem<T> = T & { next?: ListItem<T> };

/** @internal */
export type ListEntry<T> = { value: T; next?: ListEntry<T> };

export type LinkedList<T> = {
  head?: ListEntry<T>;
  tail?: ListEntry<T>;
};

/** @internal */
export function appendToList<T>(list: LinkedList<T>, value: T): void {
  const node = { value };
  if (list.tail) list.tail.next = node;
  list.tail = node;
  if (!list.head) list.head = node;
}

/** @internal */
export function appendListToEnd<T>(
  list1: LinkedList<T>,
  list2: LinkedList<T>,
): void {
  if (!list1.head) list1.head = list2.head;
  if (list1.tail) list1.tail.next = list2.head;
  if (list2.tail) list1.tail = list2.tail;
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
