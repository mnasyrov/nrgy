import { createQueue } from './queue';

describe('Queue', () => {
  describe('isEmpty()', () => {
    it('should displays is there any item in the queue', () => {
      const queue = createQueue<number>();
      expect(queue.isEmpty()).toBe(true);

      queue.add(1);
      expect(queue.isEmpty()).toBe(false);

      queue.get();
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('add()', () => {
    it('should append items to the queue', () => {
      const queue = createQueue<number>();

      queue.add(1);
      queue.add(2);
      queue.add(3);

      expect(queue.get()).toBe(1);
      expect(queue.get()).toBe(2);
      expect(queue.get()).toBe(3);

      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('get()', () => {
    it('should pops the first item from the queue', () => {
      const queue = createQueue<number>();

      expect(queue.get()).toBe(undefined);
      expect(queue.get()).toBe(undefined);

      queue.add(1);
      queue.add(2);
      expect(queue.get()).toBe(1);
      expect(queue.get()).toBe(2);

      expect(queue.get()).toBe(undefined);
      expect(queue.get()).toBe(undefined);
    });
  });
});
