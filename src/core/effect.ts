import { TaskScheduler } from '../utils/schedulers';

import { createAtomEffect } from './atomEffect';
import { Atom, isAtom } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { getSignalNode, isSignal, Signal } from './signal';
import { SignalEffect } from './signalEffect';

/**
 * An effect can, optionally, register a cleanup function. If registered, the cleanup is executed
 * before the next effect run. The cleanup function makes it possible to "cancel" any work that the
 * previous effect run might have started.
 */
export type EffectCleanupFn = () => void;

/**
 * A callback passed to the effect function that makes it possible to register cleanup logic.
 */
export type EffectCleanupRegisterFn = (cleanupFn: EffectCleanupFn) => void;

/**
 * A global reactive effect, which can be manually destroyed.
 */
export type EffectSubscription = Readonly<{
  /**
   * Shut down the effect, removing it from any upcoming scheduled executions.
   */
  destroy(): void;
}>;

type SideEffectFn = (onCleanup: EffectCleanupRegisterFn) => void;
type ValueCallbackFn<T> = (value: T) => unknown;
type ErrorCallbackFn = (error: unknown) => unknown;

/*
TODO
- put "onError" and "sync: boolean" to options as the last argument
 */

export interface EffectFn {
  <T>(source: Signal<T>, callback: ValueCallbackFn<T>): EffectSubscription;
  <T>(
    source: Atom<T>,
    callback: ValueCallbackFn<T>,
    onError?: ErrorCallbackFn,
  ): EffectSubscription;
  (source: SideEffectFn, onError?: ErrorCallbackFn): EffectSubscription;
}

export const effect: EffectFn = <
  T,
  Source extends Signal<T> | Atom<T> | SideEffectFn,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T>
    : Source extends Atom<T>
    ? ValueCallbackFn<T>
    : never,
  ErrorCallback extends Source extends Signal<T>
    ? never
    : Source extends Atom<T>
    ? ErrorCallbackFn
    : ErrorCallbackFn,
>(
  source: Source,
  callback?: Callback,
  errorCallback?: ErrorCallback,
) => {
  return effectFactory<T, Source, Callback, ErrorCallback>(
    ENERGY_RUNTIME.asyncScheduler,
    source,
    callback,
    errorCallback,
  );
};

export const syncEffect: EffectFn = <
  T,
  Source extends Signal<T> | Atom<T> | SideEffectFn,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T>
    : Source extends Atom<T>
    ? ValueCallbackFn<T>
    : never,
  ErrorCallback extends Source extends Signal<T>
    ? never
    : Source extends Atom<T>
    ? ErrorCallbackFn
    : ErrorCallbackFn,
>(
  source: Source,
  callback?: Callback,
  errorCallback?: ErrorCallback,
) => {
  return effectFactory<T, Source, Callback, ErrorCallback>(
    ENERGY_RUNTIME.syncScheduler,
    source,
    callback,
    errorCallback,
  );
};

function effectFactory<
  T,
  Source extends Signal<T> | Atom<T> | SideEffectFn,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T>
    : Source extends Atom<T>
    ? ValueCallbackFn<T>
    : never,
  ErrorCallback extends Source extends Signal<T>
    ? never
    : Source extends Atom<T>
    ? ErrorCallbackFn
    : ErrorCallbackFn,
>(
  scheduler: TaskScheduler,
  source: Source,
  callback?: Callback,
  errorCallback?: ErrorCallback,
): EffectSubscription {
  if (isSignal<T>(source)) {
    if (!callback) throw new Error('callback is missed');
    const node = getSignalNode<T>(source);

    const signalEffect = new SignalEffect<T>(scheduler, callback);
    node.subscribe(signalEffect.ref);

    return { destroy: () => signalEffect.destroy() };
  }

  let sideEffectFn: SideEffectFn;
  if (isAtom<T>(source)) {
    if (!callback) throw new Error('callback is missed');
    sideEffectFn = function () {
      callback(source());
    };
  } else {
    sideEffectFn = source as SideEffectFn;
  }

  const atomEffect = createAtomEffect(scheduler, sideEffectFn, errorCallback);
  // Effect starts dirty.
  atomEffect.notify();
  return { destroy: () => atomEffect.destroy() };
}
