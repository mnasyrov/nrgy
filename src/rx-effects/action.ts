import { Observable, Subscription } from 'rxjs';

import { signal, Signal } from '../core';
import { observe, SignalObserveOptions } from '../rxjs';

/**
 * Action of Rx-Effects
 */
export type Action<Event> = {
  readonly event$: Observable<Event>;
  (event: Event): void;
} & ([Event] extends [undefined | void]
  ? { (event?: Event): void }
  : { (event: Event): void });

export function toAction<T>(
  source: Signal<T>,
  options?: SignalObserveOptions,
): Action<T> {
  const action = (value: T): void => source(value);
  action.event$ = observe(source, options);

  return action as unknown as Action<T>;
}

export function fromAction<T>(action: Action<T>): Signal<T> {
  let subscription: Subscription | undefined;

  const s = signal<T>({
    onSubscribe: () => {
      if (!subscription) {
        subscription = action.event$.subscribe((value) => s(value));
      }
    },

    onUnsubscribe: (isEmpty) => {
      if (isEmpty) {
        subscription?.unsubscribe();
        subscription = undefined;
      }
    },
  });

  return s;
}
