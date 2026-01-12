import {
  appendListToEnd,
  appendToList,
  forEachInList,
  LinkedList,
  popListHead,
} from './list';

describe('LinkedList', () => {
  describe('appendToList()', () => {
    it('should append items to the list', () => {
      const list: LinkedList<number> = {};

      appendToList(list, 1);
      appendToList(list, 2);
      appendToList(list, 3);

      expect(list.head?.value).toBe(1);
      expect(list.head?.next?.value).toBe(2);
      expect(list.head?.next?.next?.value).toBe(3);
    });
  });

  describe('popListHead()', () => {
    it('should pops the first item from the queue', () => {
      const list: LinkedList<number> = {};

      expect(popListHead(list)).toBe(undefined);
      expect(popListHead(list)).toBe(undefined);

      appendToList(list, 1);
      appendToList(list, 2);
      expect(popListHead(list)).toBe(1);
      expect(popListHead(list)).toBe(2);

      expect(popListHead(list)).toBe(undefined);
      expect(popListHead(list)).toBe(undefined);
    });
  });
});

describe('appendListToEnd()', () => {
  it('should append the second list to the end of the first list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list1, 2);
    appendToList(list2, 3);
    appendToList(list2, 4);

    appendListToEnd(list1, list2);

    expect(dumpList(list1)).toEqual([1, 2, 3, 4]);
  });

  it('should append the second list to the empty list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list2, 3);
    appendToList(list2, 4);

    appendListToEnd(list1, list2);

    expect(dumpList(list1)).toEqual([3, 4]);
  });

  it('should append the empty list to the end of the first list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list1, 2);

    appendListToEnd(list1, list2);

    expect(dumpList(list1)).toEqual([1, 2]);

    expect(list1.head?.value).toEqual(1);
    expect(list1.head?.next?.value).toEqual(2);
    expect(list1.tail?.value).toEqual(2);
    expect(list1.tail?.next).toBeUndefined();
  });

  it('should append the list of single item to the end of other list with single item', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list2, 3);

    appendListToEnd(list1, list2);

    expect(dumpList(list1)).toEqual([1, 3]);

    expect(list1.head?.value).toEqual(1);
    expect(list1.head?.next?.value).toEqual(3);
    expect(list1.tail?.value).toEqual(3);
    expect(list1.tail?.next).toBeUndefined();
  });

  it('should append the list of single item to the empty list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list2, 3);
    appendListToEnd(list1, list2);

    expect(dumpList(list1)).toEqual([3]);

    expect(list1.head?.value).toEqual(3);
    expect(list1.head?.next).toBeUndefined();
    expect(list1.tail?.value).toEqual(3);
    expect(list1.tail?.next).toBeUndefined();
  });
});

describe('forEachInList()', () => {
  it('iterates over values in insertion order (by next pointers)', () => {
    const list: LinkedList<number> = {};
    appendToList(list, 1);
    appendToList(list, 2);
    appendToList(list, 3);

    const seen: number[] = [];
    forEachInList(list, (v) => seen.push(v));

    expect(seen).toEqual([1, 2, 3]);
    // Ensure iteration does not mutate the list
    expect(dumpList(list)).toEqual([1, 2, 3]);
  });
});

function dumpList<T>(list: LinkedList<T>): T[] {
  const result: T[] = [];
  let node = list.head;
  while (node) {
    result.push(node.value);
    node = node.next;
  }
  return result;
}
