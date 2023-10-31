import { BehaviorSubject, Observable, Subscribable } from 'rxjs';

import { AtomObservable, createAtomSubject } from '../core/atomSubject';
import { createScope } from '../core/scope';

/**
 * Options for `fromObservable`.
 *
 * @publicApi
 */
export interface FromObservableOptions<T> {
  /**
   * Initial value for the atom produced by `fromObservable`.
   *
   * This will be the value of the atom until the observable emits its first value.
   */
  initialValue?: T;
}

/**
 * Get the current value of an `Observable` as a reactive `Atom`.
 *
 * `fromObservable` returns a `Atom` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Atom` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: BehaviorSubject<T>,
): AtomObservable<T>;

/**
 * Get the current value of an `Observable` as a reactive `Atom`.
 *
 * `fromObservable` returns a `Atom` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Atom` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: Observable<T> | Subscribable<T>,
): AtomObservable<T | undefined>;

/**
 * Get the current value of an `Observable` as a reactive `Atom`.
 *
 * `fromObservable` returns a `Atom` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Atom` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: Observable<T> | Subscribable<T>,
  options?: FromObservableOptions<undefined>,
): AtomObservable<T | undefined>;

/**
 * Get the current value of an `Observable` as a reactive `Atom`.
 *
 * `fromObservable` returns a `Atom` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Atom` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T, U extends T | null | undefined>(
  source: Observable<T> | Subscribable<T>,
  options: FromObservableOptions<U> & { initialValue: U },
): AtomObservable<T | U>;

/**
 * Get the current value of an `Observable` as a reactive `Atom`.
 *
 * `fromObservable` returns a `Atom` which provides synchronous reactive access to values produced
 * by the given `Observable`, by subscribing to that `Observable`. The returned `Atom` will always
 * have the most recent value emitted by the subscription, and will throw an error if the
 * `Observable` errors.
 */
export function fromObservable<T>(
  source: Observable<T> | Subscribable<T>,
  options: FromObservableOptions<undefined>,
): AtomObservable<T>;

export function fromObservable<T, U = undefined>(
  source: Observable<T> | Subscribable<T>,
  options?: FromObservableOptions<U>,
): AtomObservable<T | U> {
  const scope = createScope();

  // Note: T is the Observable value type, and U is the initial value type. They don't have to be
  // the same - the returned atom gives values of type `T`.
  //
  // If an initial value was passed, use it. Otherwise, use `undefined` as the initial value.
  const atomSubject = createAtomSubject<T | U>(options?.initialValue as U, {
    onDestroy: () => scope.destroy(),
  });

  scope.add(
    source.subscribe({
      next: atomSubject.next,
      error: atomSubject.error,
      // Completion of the Observable is meaningless to the atom. Atoms don't have a concept of
      // "complete".
    }),
  );

  return atomSubject.asObservable();
}
