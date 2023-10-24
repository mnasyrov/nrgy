import { Observable, share, shareReplay, skip } from 'rxjs';

import { effect, effectSync, Signal } from '../core';
import { SIGNAL_RUNTIME } from '../core/runtime';

export type ToObservableOptions = {
  sync?: boolean;
  onlyChanges?: boolean;
};

/**
 * Exposes the value of an `Signal` as an RxJS `Observable`.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 */
export function toObservable<T>(
  source: Signal<T>,
  options?: ToObservableOptions,
): Observable<T> {
  const observable = new Observable<T>((subscriber) => {
    const effectFn = options?.sync ? effectSync : effect;
    const scheduler = options?.sync
      ? SIGNAL_RUNTIME.syncScheduler
      : SIGNAL_RUNTIME.asyncScheduler;

    const watcher = effectFn(() => {
      try {
        const value = source();
        scheduler.schedule({ run: () => subscriber.next(value) });
      } catch (error) {
        scheduler.schedule({ run: () => subscriber.error(error) });
      }
    });

    return () => watcher.destroy();
  });

  if (options?.onlyChanges) {
    return observable.pipe(skip(1), share({ resetOnRefCountZero: true }));
  } else {
    return observable.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
