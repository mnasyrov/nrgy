import { Observable, share, shareReplay, skip } from 'rxjs';

import { Atom } from '../core/common';
import { effect, syncEffect } from '../core/effect';
import { ENERGY_RUNTIME } from '../core/runtime';

export type ObserveOptions = {
  sync?: boolean;
  onlyChanges?: boolean;
};

/**
 * Exposes the value of an `Atom` as an RxJS `Observable`.
 *
 * The atom's value will be propagated into the `Observable`'s subscribers using an `effect`.
 */
export function observe<T>(
  source: Atom<T>,
  options?: ObserveOptions,
): Observable<T> {
  const observable = new Observable<T>((subscriber) => {
    const effectFn = options?.sync ? syncEffect : effect;
    const scheduler = options?.sync
      ? ENERGY_RUNTIME.syncScheduler
      : ENERGY_RUNTIME.asyncScheduler;

    const watcher = effectFn(() => {
      try {
        const value = source();
        scheduler.schedule(() => subscriber.next(value));
      } catch (error) {
        scheduler.schedule(() => subscriber.error(error));
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
