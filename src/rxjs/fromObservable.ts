import { BehaviorSubject, Observable, Subscribable } from 'rxjs';

import { Mutable, Signal } from '../core/common';
import { compute } from '../core/compute';
import { signal, WritableSignal } from '../core/signal';

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
  // Note: T is the Observable value type, and U is the initial value type. They don't have to be
  // the same - the returned signal gives values of type `T`.
  //
  // If an initial value was passed, use it. Otherwise, use `undefined` as the initial value.
  const state: WritableSignal<State<T | U>> = signal<State<T | U>>({
    kind: StateKind.Value,
    value: options?.initialValue as U,
  });

  const sub = source.subscribe({
    next: (value) => state.set({ kind: StateKind.Value, value }),
    error: (error) => state.set({ kind: StateKind.Error, error }),
    // Completion of the Observable is meaningless to the signal. Signals don't have a concept of
    // "complete".
  });

  // The actual returned signal is a `computed` of the `State` signal, which maps the various states
  // to either values or errors.
  const result: ObservableSignal<T | U> = compute(() => {
    const current = state();
    switch (current.kind) {
      case StateKind.Value:
        return current.value;
      case StateKind.Error:
        throw current.error;
    }
  }) as ObservableSignal<T | U>;

  const mutable = result as Mutable<ObservableSignal<T | U>>;

  // Unsubscribe when the current context is destroyed, if requested.
  mutable.destroy = () => {
    state.destroy();
    sub.unsubscribe();
  };

  return result;
}

const enum StateKind {
  Value,
  Error,
}

interface ValueState<T> {
  kind: StateKind.Value;
  value: T;
}

interface ErrorState {
  kind: StateKind.Error;
  error: unknown;
}

type State<T> = ValueState<T> | ErrorState;
