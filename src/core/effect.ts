import { TaskScheduler } from '../utils/schedulers';

import { isAtom } from './atom';
import { AtomEffect } from './atomEffect';
import { Atom, Signal } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { getSignalNode, isSignal } from './signal';
import { SignalEffect } from './signalEffect';

/**
 * A reactive effect, which can be manually destroyed.
 */
export type EffectSubscription<R> = Readonly<{
  onResult: Signal<R>;
  onError: Signal<unknown>;
  onDestroy: Signal<void>;

  /**
   * Shut down the effect, removing it from any upcoming scheduled executions.
   */
  destroy(): void;
}>;

type SideEffectFn<R> = () => R;
type ValueCallbackFn<T, R> = (value: T) => R;

export interface EffectFn {
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

export const effect: EffectFn = <
  T,
  R,
  Source extends Signal<T> | Atom<T> | SideEffectFn<R>,
  Callback extends Source extends Signal<T>
    ? ValueCallbackFn<T, R>
    : Source extends Atom<T>
      ? ValueCallbackFn<T, R>
      : never,
>(
  source: Source,
  callback?: Callback,
) => {
  const isForcedSyncSource =
    isSignal<T>(source) && getSignalNode<T>(source)?.sync;

  const scheduler = isForcedSyncSource
    ? ENERGY_RUNTIME.syncScheduler
    : ENERGY_RUNTIME.asyncScheduler;

  return effectFactory<T, R, Source, Callback>(scheduler, source, callback);
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
>(
  source: Source,
  callback?: Callback,
) => {
  return effectFactory<T, R, Source, Callback>(
    ENERGY_RUNTIME.syncScheduler,
    source,
    callback,
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
>(
  scheduler: TaskScheduler,
  source: Source,
  callback?: Callback,
): EffectSubscription<R> {
  if (isSignal<T>(source)) {
    if (!callback) throw new Error('callback is missed');
    const node = getSignalNode<T>(source);

    const signalEffect = new SignalEffect<T>(scheduler, callback);
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
    if (!callback) throw new Error('callback is missed');
    sideEffectFn = function () {
      return callback(source());
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
}
