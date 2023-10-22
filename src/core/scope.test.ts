import { effect } from './effect';
import { createScope } from './scope';
import { signal } from './signal';

describe('Scope', () => {
  describe('destroy()', () => {
    it('should unsubscribe all collected subscriptions', () => {
      const scope = createScope();
      const teardown1 = jest.fn();
      const teardown2 = jest.fn();

      scope.handle(teardown1);
      scope.handle(teardown2);
      scope.destroy();

      expect(teardown1).toHaveBeenCalledTimes(1);
      expect(teardown2).toHaveBeenCalledTimes(1);
    });
  });

  describe('handle()', () => {
    it('should be able to unsubscribe the created effect from the signal', async () => {
      const scope = createScope();

      const source = signal<number>(1);
      const results: number[] = [];
      const handler = jest.fn(() => results.push(source() * 3));

      scope.handle(effect(handler));
      source.set(2);
      scope.destroy();
      source.set(3);

      expect(results).toEqual([3, 6]);
    });
  });

  describe('create()', () => {
    it('should be able to unsubscribe the created signal', async () => {
      const scope = createScope();

      const value = scope.create(() => signal(1));

      expect(value()).toBe(1);

      scope.destroy();
      value.set(2);
      expect(value()).toBe(1);
    });
  });
});
