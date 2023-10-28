import { action } from './action';
import { effect, EffectFn, effectSync } from './effect';
import { signal } from './signal';

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
    signal: typeof signal;
    effect: EffectFn;
    effectSync: EffectFn;
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
    const value = factory(...args);
    return this.add(value);
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
    const result = action<T>(...args);
    this.add(result);
    return result;
  }

  signal<T>(...args: Parameters<typeof signal<T>>) {
    const result = signal(...args);
    this.add(result);
    return result;
  }

  effect(...args: Parameters<EffectFn>) {
    const result = effect(...args);
    this.add(result);
    return result;
  }

  effectSync(...args: Parameters<EffectFn>) {
    const result = effectSync(...args);
    this.add(result);
    return result;
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
    signal: scope.signal.bind(scope),
    effect: scope.effect.bind(scope),
    effectSync: scope.effectSync.bind(scope),
  };
}
