import {
  addToListHead,
  appendListToEnd,
  appendListToHead,
  appendToList,
  clearList,
  cloneListPointer,
  copyToList,
  forEachInList,
  isEmptyList,
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

describe('Linked list (additional tests)', () => {
  describe('cloneListPointer()', () => {
    it('returns a shallow copy of head/tail pointers', () => {
      const list: LinkedList<number> = {};
      appendToList(list, 1);
      appendToList(list, 2);

      const clone = cloneListPointer(list);

      // Pointers are exactly the same objects
      expect(clone.head).toBe(list.head);
      expect(clone.tail).toBe(list.tail);

      // And the structure is as expected
      expect(clone.head?.value).toBe(1);
      expect(clone.head?.next?.value).toBe(2);
    });
  });

  describe('isEmptyList()', () => {
    it('detects empty and non-empty lists', () => {
      const list: LinkedList<number> = {};

      expect(isEmptyList(list)).toBe(true);

      appendToList(list, 1);
      expect(isEmptyList(list)).toBe(false);

      clearList(list);
      expect(isEmptyList(list)).toBe(true);
    });
  });

  describe('clearList()', () => {
    it('clears head and tail', () => {
      const list: LinkedList<number> = {};
      appendToList(list, 1);
      appendToList(list, 2);

      expect(list.head).toBeDefined();
      expect(list.tail).toBeDefined();

      clearList(list);

      expect(list.head).toBeUndefined();
      expect(list.tail).toBeUndefined();
    });
  });

  describe('addToListHead()', () => {
    it('adds items to the head; updates tail when list was empty', () => {
      const list: LinkedList<number> = {};

      addToListHead(list, 2);
      expect(dumpList(list)).toEqual([2]);
      // when the list was empty, both head and tail should point to the same node
      expect(list.head).toBe(list.tail);

      addToListHead(list, 1);
      expect(dumpList(list)).toEqual([1, 2]);
      // tail should remain the node with value 2
      expect(list.tail?.value).toBe(2);
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

  describe('copyToList()', () => {
    it('copies all nodes from source to empty target using new node objects', () => {
      const source: LinkedList<number> = {};
      appendToList(source, 1);
      appendToList(source, 2);
      appendToList(source, 3);

      const target: LinkedList<number> = {};
      copyToList(source, target);

      expect(dumpList(target)).toEqual([1, 2, 3]);

      // nodes must be different instances (no shared references)
      if (source.head && target.head) {
        expect(target.head).not.toBe(source.head);
        expect(target.head.value).toBe(source.head.value);
      }
    });

    it('appends copied nodes to an already non-empty target', () => {
      const source: LinkedList<number> = {};
      appendToList(source, 1);
      appendToList(source, 2);

      const target: LinkedList<number> = {};
      appendToList(target, 0);

      copyToList(source, target);

      expect(dumpList(target)).toEqual([0, 1, 2]);
    });
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
