import { Observable, Subscribable } from 'rxjs';

import { DestroyableAtom } from '../core';
import { createAtomSubject } from '../core/atomSubject';
import { createScope } from '../core/scope';

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
): DestroyableAtom<T | undefined>;

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
  initialValue: T,
): DestroyableAtom<T>;

export function fromObservable<T, U = undefined>(
  source: Observable<T> | Subscribable<T>,
  initialValue?: T | U,
): DestroyableAtom<T | U> {
  const scope = createScope();

  // Note: T is the Observable value type, and U is the initial value type. They don't have to be
  // the same - the returned atom gives values of type `T`.
  //
  // If an initial value was passed, use it. Otherwise, use `undefined` as the initial value.
  const atomSubject = createAtomSubject<T | U>(initialValue as U, {
    onDestroy: scope.destroy,
  });

  scope.add(
    source.subscribe({ next: atomSubject.next, error: atomSubject.error }),
  );

  return atomSubject.asDestroyable();
}
