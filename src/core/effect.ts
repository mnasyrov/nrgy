import { isAtom } from './atom';
import { AtomEffect } from './atomEffect';
import { AtomList, combineAtoms } from './atomUtils';
import { AnyFunction, Atom, Signal } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { TaskScheduler } from './schedulers';
import { getSignalNode, isSignal } from './signal';
import { SignalEffect } from './signalEffect';

/**
 * Options for an effect
 */
export type EffectOptions = {
  sync?: boolean;
  scheduler?: TaskScheduler;
};

/**
 * A reactive effect, which can be manually destroyed.
 */
export type EffectSubscription<R> = Readonly<{
  /**
   * Signal that emits the result of the effect.
   */
  onResult: Signal<R>;

  /**
   * Signal that emits the error of the effect.
   */
  onError: Signal<unknown>;

  /**
   * Signal that emits when the effect is destroyed.
   */
  onDestroy: Signal<void>;

  /**
   * Shut down the effect, removing it from any upcoming scheduled executions.
   */
  destroy(): void;
}>;

type EffectAction<T, R> = (value: T) => R;

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
  const scheduler = selectScheduler(source, options);

  if (isSignal<T>(source)) {
    const node = getSignalNode<T>(source);
    const signalEffect = new SignalEffect<T>(scheduler, action);

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

export function selectScheduler(
  source: unknown,
  options: EffectOptions | undefined,
): TaskScheduler {
  if (options?.scheduler) {
    return options.scheduler;
  }

  if (options?.sync) {
    return ENERGY_RUNTIME.syncScheduler;
  }

  return isForcedSyncSource(source)
    ? ENERGY_RUNTIME.syncScheduler
    : ENERGY_RUNTIME.asyncScheduler;
}

export function isForcedSyncSource(source: unknown): boolean {
  return (
    isSignal<unknown>(source) && getSignalNode<unknown>(source).sync === true
  );
}

export interface SyncEffectFn {
  /**
   * Creates a new effect for a signal
   */
  <T, R>(source: Signal<T>, action: EffectAction<T, R>): EffectSubscription<R>;

  /**
   * Creates a new effect for an atom
   */
  <T, R>(source: Atom<T>, callback: EffectAction<T, R>): EffectSubscription<R>;

  /**
   * Creates a new effect for a list of atoms
   */
  <TValues extends unknown[], R>(
    sources: AtomList<TValues>,
    action: EffectAction<TValues, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;
}

export const syncEffect: SyncEffectFn = <T, R>(
  source: Signal<T> | Atom<T> | AtomList<T[]>,
  action?: EffectAction<T, R>,
) => {
  const options: EffectOptions = { scheduler: ENERGY_RUNTIME.syncScheduler };

  return (effect as AnyFunction)(source, action, options);
};
