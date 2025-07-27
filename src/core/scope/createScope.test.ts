import { atom } from '../reactivity/atom';
import { runEffects } from '../utils/runEffects';

import { createScope } from './createScope';

describe('createScope()', () => {
  describe('onDestroy()', () => {
    it('should be called when the scope is destroyed', () => {
      const scope = createScope();

      const teardown = jest.fn();
      scope.onDestroy(teardown);

      scope.destroy();

      expect(teardown).toHaveBeenCalledTimes(1);
    });
  });

  describe('add()', () => {
    it('should add a resource for later disposal', async () => {
      const scope = createScope();

      const value = scope.add(atom(1));

      expect(value()).toBe(1);

      scope.destroy();
      value.set(2);
      expect(value()).toBe(1);
    });
  });

  describe('destroy()', () => {
    it('should do nothing if the scope is empty', () => {
      const scope = createScope();
      scope.destroy();
      expect(() => scope.destroy()).not.toThrow();
    });

    it('should do nothing if the scope is already destroyed', () => {
      const scope = createScope();

      const teardown = jest.fn();
      scope.onDestroy(teardown);
      scope.destroy();
      scope.destroy();

      expect(teardown).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe all collected subscriptions', () => {
      const scope = createScope();

      const teardown1 = jest.fn();
      const unsubscribe = jest.fn();
      const destroy = jest.fn();

      scope.onDestroy(teardown1);
      scope.onDestroy({ unsubscribe });
      scope.onDestroy({ destroy });
      scope.destroy();

      expect(teardown1).toHaveBeenCalledTimes(1);
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('createScope()', () => {
    it('should creates a child scope', () => {
      const onParentDestroy = jest.fn();
      const onChildDestroy1 = jest.fn();
      const onChildDestroy2 = jest.fn();

      const parent = createScope();
      parent.onDestroy(onParentDestroy);

      const child1 = parent.createScope();
      child1.onDestroy(onChildDestroy1);

      const child2 = parent.createScope();
      child2.onDestroy(onChildDestroy2);

      child1.destroy();
      expect(onParentDestroy).toHaveBeenCalledTimes(0);
      expect(onChildDestroy1).toHaveBeenCalledTimes(1);
      expect(onChildDestroy2).toHaveBeenCalledTimes(0);

      onChildDestroy1.mockClear();

      parent.destroy();
      expect(onParentDestroy).toHaveBeenCalledTimes(1);
      expect(onChildDestroy1).toHaveBeenCalledTimes(0);
      expect(onChildDestroy2).toHaveBeenCalledTimes(1);
    });
  });

  describe('atom()', () => {
    it('should create and register an atom', () => {
      const scope = createScope();
      const onDestroy = jest.fn();

      scope.atom(1, { onDestroy });
      scope.destroy();

      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('effect()', () => {
    it('should create and register an effect', () => {
      const scope = createScope();
      const callback = jest.fn();

      scope.effect(atom(1), callback);
      runEffects();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(1);
    });
  });

  describe('syncEffect()', () => {
    it('should create and register a sync effect', () => {
      const scope = createScope();
      const callback = jest.fn();

      scope.syncEffect(atom(1), callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(1);
    });
  });
});
