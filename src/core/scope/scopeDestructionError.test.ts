import { BaseScope } from './baseScope';
import { ScopeDestructionError } from './scopeDestructionError';

describe('ScopeDestructionError', () => {
  it('should be thrown when one or more errors have occurred during the `destroy`', () => {
    const scope = new BaseScope();

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
