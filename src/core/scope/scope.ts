import { atom } from '../atoms/writableAtom';
import { EffectFn } from '../effect';
import { signal } from '../signal';

import { Destroyable, ScopeTeardown, Unsubscribable } from './types';

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
