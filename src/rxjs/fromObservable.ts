import { BehaviorSubject, Observable, Subscribable } from 'rxjs';

import { Signal } from '../core';
import { createScope } from '../core/scope';
import { createSignalSubject } from '../core/signalSubject';

export type ObservableSignal<T> = Signal<T> & {
  destroy(): void;
};

/**
 * Options for `toSignal`.
 *
 * @publicApi
 */
export interface ToSignalOptions<T> {
  /**
   * Initial value for the signal produced by `toSignal`.
   *
   * This will be the value of the signal until the observable emits its first value.
   */
  initialValue?: T;
}

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `toSignal` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: BehaviorSubject<T>,
): ObservableSignal<T>;

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `toSignal` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: Observable<T> | Subscribable<T>,
): ObservableSignal<T | undefined>;

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `toSignal` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: Observable<T> | Subscribable<T>,
  options?: ToSignalOptions<undefined>,
): ObservableSignal<T | undefined>;

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `toSignal` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T, U extends T | null | undefined>(
  source: Observable<T> | Subscribable<T>,
  options: ToSignalOptions<U> & { initialValue: U },
): ObservableSignal<T | U>;

/**
 * Get the current value of an `Observable` as a reactive `Signal`.
 *
 * `toSignal` returns a `Signal` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Signal` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: Observable<T> | Subscribable<T>,
  options: ToSignalOptions<undefined>,
): ObservableSignal<T>;

export function fromObservable<T, U = undefined>(
  source: Observable<T> | Subscribable<T>,
  options?: ToSignalOptions<U>,
): ObservableSignal<T | U> {
  const scope = createScope();

  // Note: T is the Observable value type, and U is the initial value type. They don't have to be
  // the same - the returned signal gives values of type `T`.
  //
  // If an initial value was passed, use it. Otherwise, use `undefined` as the initial value.
  const signalSubject = createSignalSubject<T | U>(options?.initialValue as U, {
    onDestroy: () => scope.destroy(),
  });

  scope.add(
    source.subscribe({
      next: signalSubject.next,
      error: signalSubject.error,
      // Completion of the Observable is meaningless to the signal. Signals don't have a concept of
      // "complete".
    }),
  );

  return signalSubject.asObservable();
}
