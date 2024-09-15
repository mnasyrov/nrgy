/** @internal */
export type ListItem<T> = T & { next?: ListItem<T> };

/** @internal */
export type ListEntry<T> = { value: T; next?: ListEntry<T> };

/** @internal */
export class LinkedList<T> {
  private head: ListEntry<T> | undefined;
  private tail: ListEntry<T> | undefined;

  clonePointers(): LinkedList<T> {
    const result = new LinkedList<T>();
    result.head = this.head;
    result.tail = this.tail;

    return result;
  }

  isEmpty(): boolean {
    return !this.head;
  }

  clear(): void {
    this.head = undefined;
    this.tail = undefined;
  }

  addToHead(value: T): void {
    const node = { value, next: this.head };
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  add(value: T): void {
    const node = { value };
    if (this.tail) this.tail.next = node;
    this.tail = node;
    if (!this.head) this.head = node;
  }

  forEach(fn: (value: T) => void) {
    let node = this.head;

    while (node) {
      fn(node.value);
      node = node.next;
    }
  }
}
