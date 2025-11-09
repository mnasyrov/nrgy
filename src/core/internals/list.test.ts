import {
  appendListToEnd,
  appendListToHead,
  appendToList,
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
  });

  it('should append the list of single item to the end of other list with single item', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list2, 3);

    appendListToEnd(list1, list2);

    expect(dumpList(list1)).toEqual([1, 3]);
  });
});

describe('appendListToHead()', () => {
  it('should append the second list to the head of the first list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list1, 2);
    appendToList(list2, 3);
    appendToList(list2, 4);

    appendListToHead(list1, list2);
    expect(dumpList(list1)).toEqual([3, 4, 1, 2]);
  });

  it('should append the second list to the empty list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list2, 3);
    appendToList(list2, 4);

    appendListToHead(list1, list2);
    expect(dumpList(list1)).toEqual([3, 4]);
  });

  it('should append the empty list to the head of the first list', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list1, 2);

    appendListToHead(list1, list2);
    expect(dumpList(list1)).toEqual([1, 2]);
  });

  it('should append the list of single item to the end of other list with single item', () => {
    const list1: LinkedList<number> = {};
    const list2: LinkedList<number> = {};

    appendToList(list1, 1);
    appendToList(list2, 3);

    appendListToHead(list1, list2);

    expect(dumpList(list1)).toEqual([3, 1]);
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
