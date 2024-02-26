import { Observable, skip } from 'rxjs';

import { Atom, DestroyableAtom } from '../core';
import { fromObservable, observe } from '../rxjs';

// NOTE: Query is copy-pasted from 'rx-effects' to not use it as dependency.

/**
 * Provider for a value of a state.
 */
export type Query<T> = Readonly<{
  /** Returns the value of a state */
  get: () => T;

  /** `Observable` for value changes.  */
  value$: Observable<T>;
}>;

/**
 * Creates a Query for the given Atom
 */
export function toQuery<T>(source: Atom<T>): Query<T> {
  return {
    get: () => source(),
    value$: observe(source),
  };
}

/**
 * Creates an Atom from a Query
 */
export function fromQuery<T>(query: Query<T>): DestroyableAtom<T> {
  return fromObservable(query.value$.pipe(skip(1)), query.get());
}
