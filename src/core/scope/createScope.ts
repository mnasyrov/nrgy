import { atom } from '../atoms/writableAtom';
import { AnyFunction } from '../common';
import { effect, syncEffect } from '../effects/effect';
import { destroySignal } from '../signals/common';
import { signal } from '../signals/signal';

import { BaseScope } from './baseScope';
import { Scope } from './types';

/**
 * Creates `Scope` instance.
 */
export function createScope(): Scope {
  const scope = new BaseScope();

  return {
    onDestroy: scope.onDestroy.bind(scope),
    add: scope.add.bind(scope),
    destroy: scope.destroy.bind(scope),

    signal: (...args: any[]) => {
      const emitter = (signal as AnyFunction)(...args);
      scope.onDestroy(() => destroySignal(emitter));
      return emitter;
    },

    atom: (...args: any[]) => {
      return scope.add((atom as AnyFunction)(...args));
    },

    effect: (...args: any[]) => {
      return scope.add((effect as AnyFunction)(...args));
    },

    syncEffect: (...args: any[]) => {
      return scope.add((syncEffect as AnyFunction)(...args));
    },
  };
}
