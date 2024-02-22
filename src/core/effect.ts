import { isAtom } from './atom';
import { AtomEffect } from './atomEffect';
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

type SideEffectFn<R> = () => R;
type ValueCallbackFn<T, R> = (value: T) => R;

/**
 * An effect function
 */
export interface EffectFn {
  /**
   * Creates a new effect for a signal
   */
  <T, R>(
    source: Signal<T>,
    callback: ValueCallbackFn<T, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;

  /**
   * Creates a new effect for an atom
   */
  <T, R>(
    source: Atom<T>,
    callback: ValueCallbackFn<T, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;

  /**
   * Creates a new effect for a side effect
   */
  <R>(action: SideEffectFn<R>, options?: EffectOptions): EffectSubscription<R>;
}

/**
 * Creates a new effect
 */
export const effect: EffectFn = <T, R>(
  source: Signal<T> | Atom<T> | SideEffectFn<R>,
  callback?: ValueCallbackFn<T, R> | EffectOptions,
  options?: EffectOptions,
) => {
  const isCallbackFunction = typeof callback === 'function';

  const inferredOptions: EffectOptions | undefined = options
    ? options
    : isCallbackFunction
      ? undefined
      : callback;

  const inferredCallback: ValueCallbackFn<T, R> | undefined = isCallbackFunction
    ? callback
    : undefined;

  const scheduler = selectScheduler(source, inferredOptions);

  if (isSignal<T>(source)) {
    if (!inferredCallback) throw new Error('Callback is missed');
    const node = getSignalNode<T>(source);

    const signalEffect = new SignalEffect<T>(scheduler, inferredCallback);
    node.subscribe(signalEffect.ref);

    return {
      onResult: signalEffect.onResult,
      onError: signalEffect.onError,
      onDestroy: signalEffect.onDestroy,

      destroy: () => signalEffect.destroy(),
    };
  }

  let sideEffectFn: SideEffectFn<R>;
  if (isAtom<T>(source)) {
    if (!inferredCallback) throw new Error('Callback is missed');
    sideEffectFn = function () {
      return inferredCallback(source());
    };
  } else {
    sideEffectFn = source as SideEffectFn<R>;
  }

  const atomEffect = new AtomEffect(scheduler, sideEffectFn);

  // Effect starts dirty.
  atomEffect.notify();

  return {
    onResult: atomEffect.onResult,
    onError: atomEffect.onError,
    onDestroy: atomEffect.onDestroy,

    destroy: () => atomEffect.destroy(),
  };
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
  <T, R>(
    source: Signal<T>,
    callback: ValueCallbackFn<T, R>,
  ): EffectSubscription<R>;

  <T, R>(
    source: Atom<T>,
    callback: ValueCallbackFn<T, R>,
  ): EffectSubscription<R>;

  <R>(action: SideEffectFn<R>): EffectSubscription<R>;
}

export const syncEffect: SyncEffectFn = <T, R>(
  source: Signal<T> | Atom<T> | SideEffectFn<R>,
  callback?: ValueCallbackFn<T, R>,
) => {
  const options: EffectOptions = { scheduler: ENERGY_RUNTIME.syncScheduler };

  return (effect as AnyFunction)(source, callback, options);
};
