import { TaskScheduler } from '../utils/schedulers';

import { ActionEmitter, getActionNode, isAction } from './action';
import { ActionEffect } from './actionEffect';
import { isSignal, Signal } from './common';
import { SIGNAL_RUNTIME } from './runtime';
import { createSignalEffect } from './signalEffect';

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

export interface EffectFn {
  <T>(
    target: ActionEmitter<T>,
    callback: ValueCallbackFn<T>,
  ): EffectSubscription;
  <T>(
    target: Signal<T>,
    callback: ValueCallbackFn<T>,
    onError?: ErrorCallbackFn,
  ): EffectSubscription;
  (target: SideEffectFn, onError?: ErrorCallbackFn): EffectSubscription;
}

export const effect: EffectFn = <
  T,
  Target extends ActionEmitter<T> | Signal<T> | SideEffectFn,
  Callback extends Target extends ActionEmitter<T>
    ? ValueCallbackFn<T>
    : Target extends Signal<T>
    ? ValueCallbackFn<T>
    : never,
  ErrorCallback extends Target extends ActionEmitter<T>
    ? never
    : Target extends Signal<T>
    ? ErrorCallbackFn
    : ErrorCallbackFn,
>(
  target: Target,
  callback?: Callback,
  errorCallback?: ErrorCallback,
) => {
  return effectFactory<T, Target, Callback, ErrorCallback>(
    SIGNAL_RUNTIME.asyncScheduler,
    target,
    callback,
    errorCallback,
  );
};

export const effectSync: EffectFn = <
  T,
  Target extends ActionEmitter<T> | Signal<T> | SideEffectFn,
  Callback extends Target extends ActionEmitter<T>
    ? ValueCallbackFn<T>
    : Target extends Signal<T>
    ? ValueCallbackFn<T>
    : never,
  ErrorCallback extends Target extends ActionEmitter<T>
    ? never
    : Target extends Signal<T>
    ? ErrorCallbackFn
    : ErrorCallbackFn,
>(
  target: Target,
  callback?: Callback,
  errorCallback?: ErrorCallback,
) => {
  return effectFactory<T, Target, Callback, ErrorCallback>(
    SIGNAL_RUNTIME.syncScheduler,
    target,
    callback,
    errorCallback,
  );
};

function effectFactory<
  T,
  Target extends ActionEmitter<T> | Signal<T> | SideEffectFn,
  Callback extends Target extends ActionEmitter<T>
    ? ValueCallbackFn<T>
    : Target extends Signal<T>
    ? ValueCallbackFn<T>
    : never,
  ErrorCallback extends Target extends ActionEmitter<T>
    ? never
    : Target extends Signal<T>
    ? ErrorCallbackFn
    : ErrorCallbackFn,
>(
  scheduler: TaskScheduler,
  target: Target,
  callback?: Callback,
  errorCallback?: ErrorCallback,
): EffectSubscription {
  if (isAction<T>(target)) {
    if (!callback) throw new Error('callback is missed');
    const node = getActionNode<T>(target);

    const actionWatch = new ActionEffect<T>(scheduler, callback);
    node.subscribe(actionWatch.ref);

    return { destroy: () => actionWatch.destroy() };
  }

  let sideEffectFn: SideEffectFn;
  if (isSignal<T>(target)) {
    if (!callback) throw new Error('callback is missed');
    sideEffectFn = function () {
      callback(target());
    };
  } else {
    sideEffectFn = target as SideEffectFn;
  }

  const signalWatch = createSignalEffect(
    scheduler,
    sideEffectFn,
    errorCallback,
  );
  // Effect starts dirty.
  signalWatch.notify();
  return { destroy: () => signalWatch.destroy() };
}
