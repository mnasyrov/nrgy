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
export function appendListToEnd<T>(
  list1: LinkedList<T>,
  list2: LinkedList<T>,
): void {
  if (!list1.head) list1.head = list2.head;
  if (list1.tail) list1.tail.next = list2.head;
  if (list2.tail) list1.tail = list2.tail;
}

/** @internal */
export function appendListToHead<T>(
  list1: LinkedList<T>,
  list2: LinkedList<T>,
): void {
  if (!list2.head) return;
  if (!list1.head) {
    list1.head = list2.head;
    list1.tail = list2.tail;
  } else {
    list2.tail!.next = list1.head;
    list1.head = list2.head;
    list1.tail = list2.tail;
  }
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
export function copyToList<T>(
  source: LinkedList<T>,
  target: LinkedList<T>,
): void {
  let node = source.head;
  while (node) {
    // appendToListEnd(target, node.value);

    const copy = { value: node.value };
    if (target.tail) target.tail.next = copy;
    target.tail = copy;
    if (!target.head) target.head = copy;

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
