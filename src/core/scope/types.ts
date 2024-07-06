import { AtomFn } from '../atoms/types';
import { EffectFn } from '../effects/types';
import { SignalFn } from '../signals/types';

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
export interface Scope extends Destroyable {
  /**
   * Registers a callback or unsubscribable resource which will be called when `destroy()` is called
   */
  onDestroy: (teardown: ScopeTeardown) => void;

  /**
   * Registers an unsubscribable resource which will be called when `destroy()` is called
   */
  add: <T extends Unsubscribable | Destroyable>(resource: T) => T;

  /**
   * Destroys the scope
   */
  destroy: () => void;

  /**
   * Creates a new atom and registers it for later disposal
   */
  atom: AtomFn;

  /**
   * Creates a new signal and registers it for later disposal
   */
  signal: SignalFn;

  /**
   * Creates a new effect and registers it for later disposal
   */
  effect: EffectFn;

  /**
   * Creates a new sync effect and registers it for later disposal
   */
  syncEffect: EffectFn;
}

/**
 * `SharedScope` and `Scope` types allow to distinct which third-party code can invoke `destroy()` method.
 */
export type SharedScope = Omit<Scope, 'destroy'>;
