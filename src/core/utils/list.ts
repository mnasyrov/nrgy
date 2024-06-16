/** @internal */
export type ListItem<T> = T & { next?: ListItem<T> };

/** @internal */
export function removeFromList<T>(
  head: undefined | ListItem<T>,
  predicate: (value: T) => boolean,
): ListItem<T> | undefined {
  const root: ListItem<any> = { next: head };

  let node = root;
  while (node.next) {
    if (node.next && predicate(node.next)) {
      node.next = node.next.next;
    } else {
      node = node.next;
    }
  }

  return root.next;
}
