import { action, destroyAction } from './action';
import { atom } from './atom';
import { effect, EffectFn, syncEffect } from './effect';

export interface Unsubscribable {
  unsubscribe(): void;
}

export interface Destroyable {
  destroy(): void;
}

export type ScopeTeardown = Unsubscribable | Destroyable | (() => unknown);

/**
 * A controller-like boundary for effects and business logic.
 *
 * `Scope` collects all subscriptions which are made by child entities and provides
 * `destroy()` method to unsubscribe from them.
 */
export type Scope = Readonly<
  Destroyable & {
    onDestroy: (teardown: ScopeTeardown) => void;

    add: <T extends Unsubscribable | Destroyable>(resource: T) => T;

    action: typeof action;
    atom: typeof atom;
    effect: EffectFn;
    syncEffect: EffectFn;
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

  create<
    T extends Unsubscribable | Destroyable,
    Factory extends (...args: any[]) => T,
  >(factory: Factory, ...args: Parameters<Factory>): T {
    return this.add(factory(...args));
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

  action<T>(...args: Parameters<typeof action<T>>) {
    const emitter = action<T>(...args);
    this.onDestroy(() => destroyAction(emitter));
    return emitter;
  }

  atom<T>(...args: Parameters<typeof atom<T>>) {
    return this.add(atom(...args));
  }

  effect(...args: Parameters<EffectFn>) {
    return this.add(effect(...args));
  }

  syncEffect(...args: Parameters<EffectFn>) {
    return this.add(syncEffect(...args));
  }
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

    action: scope.action.bind(scope),
    atom: scope.atom.bind(scope),
    effect: scope.effect.bind(scope),
    syncEffect: scope.syncEffect.bind(scope),
  };
}
