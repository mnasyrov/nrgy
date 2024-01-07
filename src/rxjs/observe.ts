import { Observable, share, shareReplay, skip } from 'rxjs';

import { compute, isAtom, isSignal } from '../core';
import { Atom, Signal } from '../core/common';
import { effect, syncEffect } from '../core/effect';

export type SignalObserveOptions = {
  sync?: boolean;
};

export type AtomObserveOptions = {
  sync?: boolean;
  onlyChanges?: boolean;
};

type ObserveOptions = SignalObserveOptions & AtomObserveOptions;

export function observe<T>(
  source: Atom<T>,
  options?: AtomObserveOptions,
): Observable<T>;

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
    const effectFn = options?.sync ? syncEffect : effect;

    const subscription = isAtom(source)
      ? effectFn(
          compute(() => source()),
          (value) => subscriber.next(value),
        )
      : effectFn(source, (value) => subscriber.next(value));

    effectFn(subscription.onError, (error) => subscriber.error(error));
    effectFn(subscription.onDestroy, () => subscriber.complete());

    return () => subscription.destroy();
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
