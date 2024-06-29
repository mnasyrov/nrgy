import { isAtom } from './atom';
import { AtomEffect } from './atomEffect';
import { AtomList, combineAtoms } from './atomUtils';
import { Atom, Signal } from './common';
import { EffectAction, EffectSubscription } from './effectTypes';
import { RUNTIME } from './runtime';
import { getSignalNode, isSignal } from './signal';
import { SignalEffect } from './signalEffect';

/**
 * Options for an effect
 */
export type EffectOptions = {
  sync?: boolean;
};

/**
 * An effect function
 */
export interface EffectFn {
  /**
   * Creates a new effect for a signal
   */
  <T, R>(
    source: Signal<T>,
    action: EffectAction<T, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;

  /**
   * Creates a new effect for an atom
   */
  <T, R>(
    source: Atom<T>,
    action: EffectAction<T, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;

  /**
   * Creates a new effect for a list of atoms
   */
  <TValues extends unknown[], R>(
    sources: AtomList<TValues>,
    action: EffectAction<TValues, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;
}

/**
 * Creates a new effect
 */
export const effect: EffectFn = <T, R>(
  source: Signal<T> | Atom<T> | AtomList<T[]>,
  action: EffectAction<T, R>,
  options?: EffectOptions,
) => {
  let scheduler = options?.sync
    ? RUNTIME.syncScheduler
    : RUNTIME.asyncScheduler;

  if (isSignal<T>(source)) {
    const node = getSignalNode<T>(source);
    if (node.sync) {
      scheduler = RUNTIME.syncScheduler;
    }

    const signalEffect = new SignalEffect<T, R>(scheduler, action);

    const nodeRef = node.ref;
    node.subscribe(signalEffect.ref);

    return {
      onResult: signalEffect.onResult,
      onError: signalEffect.onError,
      onDestroy: signalEffect.onDestroy,

      destroy: () => {
        nodeRef.deref()?.unsubscribe(signalEffect.ref);
        signalEffect.destroy();
      },
    };
  }

  if (isAtom<T>(source)) {
    const atomEffect = new AtomEffect<T, R>(scheduler, source, action);

    // Effect starts dirty.
    atomEffect.notify();

    return {
      onResult: atomEffect.onResult,
      onError: atomEffect.onError,
      onDestroy: atomEffect.onDestroy,

      destroy: () => atomEffect.destroy(),
    };
  }

  if (Array.isArray(source)) {
    const list = combineAtoms(source);
    return effect(list as any, action as any, options);
  }

  throw new Error('Unexpected the first argument');
};

export const syncEffect: EffectFn = <T, R>(
  source: Signal<T> | Atom<T> | AtomList<T[]>,
  action: EffectAction<T, R>,
  options?: EffectOptions,
) => {
  return effect(source as any, action, { sync: true, ...options });
};
