import { describe, expect, it, vi } from 'vitest';
import { createScope } from './createScope.ts';
import { ScopeDestructionError } from './scopeDestructionError';

describe('ScopeDestructionError', () => {
  it('should be thrown when one or more errors have occurred during the `destroy`', () => {
    const scope = createScope();

    const teardown1 = vi.fn(() => {
      throw new Error('test error 1');
    });
    const teardown2 = vi.fn();

    scope.onDestroy(teardown1);
    scope.onDestroy(teardown2);

    expect(() => scope.destroy()).toThrow(
      new ScopeDestructionError([new Error('test error 1')]),
    );

    expect(teardown1).toHaveBeenCalledTimes(1);
    expect(teardown2).toHaveBeenCalledTimes(1);
  });

  it('should aggregate multiple errors from teardowns', () => {
    const scope = createScope();

    const e1 = new Error('first');
    const e2 = new Error('second');
    const teardown1 = vi.fn(() => {
      throw e1;
    });
    const teardown2 = vi.fn(() => {
      throw e2;
    });

    scope.onDestroy(teardown1);
    scope.onDestroy(teardown2);

    try {
      scope.destroy();
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ScopeDestructionError);
      const errors = (err as ScopeDestructionError).errors as unknown[];
      expect(errors).toEqual([e2, e1]);
    }

    expect(teardown1).toHaveBeenCalledTimes(1);
    expect(teardown2).toHaveBeenCalledTimes(1);
  });
});
