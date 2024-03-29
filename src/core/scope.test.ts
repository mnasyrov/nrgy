import { atom } from './atom';
import { createScope, ScopeDestructionError } from './scope';
import { getSignalNode } from './signal';

describe('Scope', () => {
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

  describe('signal()', () => {
    it('should create and register a signal', () => {
      const scope = createScope();

      const signal = scope.signal();
      scope.destroy();

      expect(getSignalNode(signal).isDestroyed).toBe(true);
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

      const fx = scope.effect(() => {});
      scope.destroy();

      expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
    });
  });

  describe('syncEffect()', () => {
    it('should create and register a sync effect', async () => {
      const scope = createScope();

      const fx = scope.syncEffect(() => {});
      scope.destroy();

      expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
    });
  });
});

describe('ScopeDestructionError', () => {
  it('should be thrown when one or more errors have occurred during the `destroy`', () => {
    const scope = createScope();

    const teardown1 = jest.fn(() => {
      throw new Error('test error 1');
    });
    const teardown2 = jest.fn();

    scope.onDestroy(teardown1);
    scope.onDestroy(teardown2);

    expect(() => scope.destroy()).toThrow(
      new ScopeDestructionError([new Error('test error 1')]),
    );

    expect(teardown1).toHaveBeenCalledTimes(1);
    expect(teardown2).toHaveBeenCalledTimes(1);
  });
});
