import { type Atom, createScope, runAsUntracked } from '@nrgyjs/core';
import { Observable, share, shareReplay, skip } from 'rxjs';

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
    let isEmitting = false;
    let needsComplete = false;

    const completeSubscriber = () => {
      if (!subscriber.closed) {
        subscriber.complete();
      }
    };

    scope.onDestroy(() => {
      if (isEmitting) {
        needsComplete = true;
      } else {
        completeSubscriber();
      }
    });

    scope.effect(
      source,
      (value) => {
        isEmitting = true;

        try {
          runAsUntracked(() => subscriber.next(value));
        } finally {
          isEmitting = false;

          if (needsComplete) {
            needsComplete = false;
            completeSubscriber();
          }
        }
      },
      {
        sync: options?.sync,

        onError: (error) => {
          runAsUntracked(() => subscriber.error(error));
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
