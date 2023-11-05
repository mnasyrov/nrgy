import { TaskScheduler } from '../utils/schedulers';

import { isAtom } from './atom';
import { AtomEffect } from './atomEffect';
import { Atom, Signal } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { getSignalNode, isSignal } from './signal';
import { SignalEffect } from './signalEffect';

/**
 * A global reactive effect, which can be manually destroyed.
 */
export type EffectSubscription<R> = Readonly<{
  next: Signal<R>;

  /**
   * Shut down the effect, removing it from any upcoming scheduled executions.
   */
  destroy(): void;
}>;

type SideEffectFn<R> = () => R;
type ValueCallbackFn<T, R> = (value: T) => R;
type ErrorCallbackFn = (error: unknown) => unknown;

/*
TODO
- put "onError" and "sync: boolean" to options as the last argument
 */

export interface EffectFn {
  <T, R>(
    source: Signal<T>,
    callback: ValueCallbackFn<T, R>,
    onError?: ErrorCallbackFn,
  ): EffectSubscription<R>;

  <T, R>(
    source: Atom<T>,
    callback: ValueCallbackFn<T, R>,
    onError?: ErrorCallbackFn,
  ): EffectSubscription<R>;

  <R>(
    source: SideEffectFn<R>,
    onError?: ErrorCallbackFn,
  ): EffectSubscription<R>;
}

export const effect: EffectFn = <
  T,
  R,
  Source extends Signal<T> | Atom<T> | SideEffectFn<R>,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T, R>
    : Source extends Atom<T>
    ? ValueCallbackFn<T, R>
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
  return effectFactory<T, R, Source, Callback, ErrorCallback>(
    ENERGY_RUNTIME.asyncScheduler,
    source,
    callback,
    errorCallback,
  );
};

export const syncEffect: EffectFn = <
  T,
  R,
  Source extends Signal<T> | Atom<T> | SideEffectFn<R>,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T, R>
    : Source extends Atom<T>
    ? ValueCallbackFn<T, R>
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
  return effectFactory<T, R, Source, Callback, ErrorCallback>(
    ENERGY_RUNTIME.syncScheduler,
    source,
    callback,
    errorCallback,
  );
};

function effectFactory<
  T,
  R,
  Source extends Signal<T> | Atom<T> | SideEffectFn<R>,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T, R>
    : Source extends Atom<T>
    ? ValueCallbackFn<T, R>
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
): EffectSubscription<R> {
  if (isSignal<T>(source)) {
    if (!callback) throw new Error('callback is missed');
    const node = getSignalNode<T>(source);

    const signalEffect = new SignalEffect<T>(
      scheduler,
      callback,
      errorCallback,
    );
    node.subscribe(signalEffect.ref);

    return {
      next: signalEffect.next,
      destroy: () => signalEffect.destroy(),
    };
  }

  let sideEffectFn: SideEffectFn<R>;
  if (isAtom<T>(source)) {
    if (!callback) throw new Error('callback is missed');
    sideEffectFn = function () {
      return callback(source());
    };
  } else {
    sideEffectFn = source as SideEffectFn<R>;
  }

  const atomEffect = new AtomEffect(scheduler, sideEffectFn, errorCallback);

  // Effect starts dirty.
  atomEffect.notify();

  return {
    next: atomEffect.next,
    destroy: () => atomEffect.destroy(),
  };
}
