import { atom } from '../atoms/writableAtom';
import { AnyFunction } from '../common';
import { effect, EffectFn, syncEffect } from '../effect';
import { destroySignal, signal } from '../signal';

import { Scope } from './scope';
import { BaseScope } from './scopeBase';

/**
 * `SharedScope` and `Scope` types allow to distinct which third-party code can invoke `destroy()` method.
 */
export type SharedScope = Omit<Scope, 'destroy'>;

class ScopeImpl extends BaseScope implements Scope {
  signal<T>(...args: Parameters<typeof signal<T>>) {
    const emitter = signal<T>(...args);
    this.onDestroy(() => destroySignal(emitter));
    return emitter;
  }

  atom<T>(...args: Parameters<typeof atom<T>>) {
    return this.add(atom(...args));
  }

  effect: EffectFn = (...args: any[]) => {
    return this.add((effect as AnyFunction)(...args));
  };

  syncEffect: EffectFn = (...args: any[]) => {
    return this.add((syncEffect as AnyFunction)(...args));
  };
}

/**
 * Creates `Scope` instance.
 */
export function createScope(): Scope {
  const scope = new ScopeImpl();

  return {
    destroy: scope.destroy.bind(scope),
    onDestroy: scope.onDestroy.bind(scope),

    add: scope.add.bind(scope),

    signal: scope.signal.bind(scope),
    atom: scope.atom.bind(scope),
    effect: scope.effect.bind(scope),
    syncEffect: scope.syncEffect.bind(scope),
  };
}
