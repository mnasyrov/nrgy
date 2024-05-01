import { atom } from './atom';
import { AnyFunction } from './common';
import { effect, EffectFn, syncEffect } from './effect';
import { BaseScope } from './scopeBase';
import { Destroyable, ScopeTeardown, Unsubscribable } from './scopeTypes';
import { destroySignal, signal } from './signal';

/**
 * A boundary for effects and business logic.
 *
 * `Scope` collects all subscriptions which are made by child entities and provides
 * `destroy()` method to unsubscribe from them.
 */
export type Scope = Readonly<
  Destroyable & {
    /**
     * Registers a callback or unsubscribable resource which will be called when `destroy()` is called
     */
    onDestroy: (teardown: ScopeTeardown) => void;

    /**
     * Registers an unsubscribable resource which will be called when `destroy()` is called
     */
    add: <T extends Unsubscribable | Destroyable>(resource: T) => T;

    /**
     * Creates a new atom and registers it for later disposal
     */
    atom: typeof atom;

    /**
     * Creates a new signal and registers it for later disposal
     */
    signal: typeof signal;

    /**
     * Creates a new effect and registers it for later disposal
     */
    effect: EffectFn;

    /**
     * Creates a new sync effect and registers it for later disposal
     */
    syncEffect: EffectFn;
  }
>;

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
