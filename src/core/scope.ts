import { atom } from './atom';
import { AnyFunction } from './common';
import { effect, EffectFn, syncEffect, SyncEffectFn } from './effect';
import { destroySignal, signal } from './signal';

/**
 * An object which can be unsubscribed from
 */
export interface Unsubscribable {
  unsubscribe(): void;
}

/**
 * An object which can be destroyed
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * A resource which can be unsubscribed from or destroyed
 */
export type ScopeTeardown = Unsubscribable | Destroyable | (() => unknown);

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
    syncEffect: SyncEffectFn;
  }
>;

/**
 * An error thrown when one or more errors have occurred during the
 * `destroy` of a {@link Scope}.
 */
export class ScopeDestructionError extends Error {
  readonly errors: unknown[];

  constructor(errors: unknown[]) {
    super();
    this.name = 'ScopeDestructionError';
    this.errors = errors;
  }
}

/**
 * `SharedScope` and `Scope` types allow to distinct which third-party code can invoke `destroy()` method.
 */
export type SharedScope = Omit<Scope, 'destroy'>;

class ScopeImpl implements Scope {
  private subscriptions: ScopeTeardown[] = [];

  onDestroy(teardown: ScopeTeardown): void {
    this.subscriptions.push(teardown);
  }

  add<T extends Unsubscribable | Destroyable>(resource: T): T {
    this.subscriptions.push(resource);
    return resource;
  }

  destroy(): void {
    if (this.subscriptions.length === 0) {
      return;
    }

    const teardowns = this.subscriptions;
    this.subscriptions = [];

    let errors: unknown[] | undefined;

    for (const teardown of teardowns) {
      try {
        if ('unsubscribe' in teardown) {
          teardown.unsubscribe();
        } else if ('destroy' in teardown) {
          teardown.destroy();
        } else {
          teardown();
        }
      } catch (error) {
        if (!errors) {
          errors = [];
        }
        errors.push(error);
      }
    }

    if (errors) {
      throw new ScopeDestructionError(errors);
    }
  }

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

  syncEffect: SyncEffectFn = (...args: any[]) => {
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
