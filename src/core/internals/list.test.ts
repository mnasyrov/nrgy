import { appendToList, LinkedList, popListHead } from './list';

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
