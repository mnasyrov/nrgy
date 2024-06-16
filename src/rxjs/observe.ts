import { Observable, share, shareReplay, skip } from 'rxjs';

import {
  Atom,
  createScope,
  isAtom,
  isSignal,
  Signal,
  syncEffect,
} from '../core';

/**
 * Options for `observe`
 */
export type SignalObserveOptions = {
  sync?: boolean;
};

/**
 * Options for `observe`
 */
export type AtomObserveOptions = {
  sync?: boolean;
  onlyChanges?: boolean;
};

/**
 * @internal
 *
 * Options for `observe`
 */
type ObserveOptions = SignalObserveOptions & AtomObserveOptions;

/**
 * Exposes the value of an `Atom` as an RxJS `Observable`.
 *
 * The atom's value will be propagated into the `Observable`'s subscribers using an `effect`.
 */
export function observe<T>(
  source: Atom<T>,
  options?: AtomObserveOptions,
): Observable<T>;

/**
 * Exposes the value of an `Atom` as an RxJS `Observable`.
 *
 * The atom's value will be propagated into the `Observable`'s subscribers using an `effect`.
 */
export function observe<T>(
  source: Signal<T>,
  options?: SignalObserveOptions,
): Observable<T>;

/**
 * Exposes the value of an `Atom` as an RxJS `Observable`.
 *
 * The atom's value will be propagated into the `Observable`'s subscribers using an `effect`.
 */
export function observe<T>(
  source: Atom<T> | Signal<T>,
  options?: ObserveOptions,
): Observable<T> {
  const observable = new Observable<T>((subscriber) => {
    const scope = createScope();
    scope.onDestroy(() => subscriber.complete());

    const effectFn = options?.sync ? scope.syncEffect : scope.effect;

    const fx = effectFn(source as Atom<T>, (value) => subscriber.next(value));

    syncEffect(fx.onError, (error) => subscriber.error(error));
    syncEffect(fx.onDestroy, () => scope.destroy());

    if (isAtom(source)) {
      // This is an artificial effect for tracking the destruction of the source atom.
      // It is necessary to unsubscribe the subscriber when the source atom is destroyed.
      const sourceFx = scope.syncEffect(source, () => {});
      scope.syncEffect(sourceFx.onDestroy, () => scope.destroy());
    }

    return () => scope.destroy();
  });

  if (isSignal(source)) {
    // Signal
    return observable.pipe(share({ resetOnRefCountZero: true }));
  } else {
    // Atom
    if (options?.onlyChanges) {
      return observable.pipe(skip(1), share({ resetOnRefCountZero: true }));
    } else {
      return observable.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
  }
}
