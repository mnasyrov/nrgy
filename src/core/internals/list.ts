/** @internal */
export type ListItem<T> = T & { next?: ListItem<T> };

/** @internal */
export type ListEntry<T> = { value: T; next?: ListEntry<T> };

export type LinkedList<T> = {
  head?: ListEntry<T>;
  tail?: ListEntry<T>;
};

/** @internal */
export function cloneLinkedList<T>(list: LinkedList<T>): LinkedList<T> {
  return {
    head: list.head,
    tail: list.tail,
  };
}

/** @internal */
export function isEmptyLinkedList<T>(list: LinkedList<T>): boolean {
  return !list.head;
}

/** @internal */
export function clearLinkedList<T>(list: LinkedList<T>): void {
  list.head = undefined;
  list.tail = undefined;
}

/** @internal */
export function addToHeadLinkedList<T>(list: LinkedList<T>, value: T): void {
  const node = { value, next: list.head };
  list.head = node;
  if (!list.tail) {
    list.tail = node;
  }
}

/** @internal */
export function appendToLinkedList<T>(list: LinkedList<T>, value: T): void {
  const node = { value };
  if (list.tail) list.tail.next = node;
  list.tail = node;
  if (!list.head) list.head = node;
}

/** @internal */
export function forEachInLinkedList<T>(
  list: LinkedList<T>,
  fn: (value: T) => void,
): void {
  let node = list.head;
  while (node) {
    fn(node.value);
    node = node.next;
  }
}
