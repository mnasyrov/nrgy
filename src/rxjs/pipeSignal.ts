import { MonoTypeOperatorFunction, Subscription } from 'rxjs';

import { Signal } from '../core/common';
import { signal } from '../core/signal';

import { toObservable } from './toObservable';

/**
 * Creates a deferred or transformed view of the store.
 */
export function pipeSignal<T>(
  source: Signal<T>,
  operator: MonoTypeOperatorFunction<T>,
): Signal<T> {
  let subscription: Subscription | undefined;

  const clone = signal<T>(source(), {
    onDestroy: () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    },
  });

  subscription = toObservable(source)
    .pipe(operator)
    .subscribe({
      next: (state) => clone.set(state),
      complete: () => clone.destroy(),
    });

  return clone;
}
