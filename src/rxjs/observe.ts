import { Observable, share, shareReplay, skip } from 'rxjs';

import { Atom, createScope } from '../core';
import { RUNTIME } from '../core/reactivity/runtime';

/**
 * Options for `observe`
 */
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
    const scope = createScope();
    scope.onDestroy(() => subscriber.complete());

    scope.effect(
      source,
      (value) => {
        RUNTIME.runAsUntracked(() => subscriber.next(value));
      },
      {
        sync: options?.sync,

        onError: (error) => {
          RUNTIME.runAsUntracked(() => subscriber.error(error));
        },

        onDestroy: () => {
          scope.destroy();
        },
      },
    );

    // This is an artificial effect for tracking the destruction of the source atom.
    // It is necessary to unsubscribe the subscriber when the source atom is destroyed.
    scope.syncEffect(source, () => {}, {
      onDestroy: () => scope.destroy(),
    });

    return () => scope.destroy();
  });

  if (options?.onlyChanges) {
    return observable.pipe(skip(1), share({ resetOnRefCountZero: true }));
  } else {
    return observable.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
