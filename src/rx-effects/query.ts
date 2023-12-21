import { Observable, skip } from 'rxjs';

import { Atom, AtomObservable } from '../core';
import { fromObservable, observe } from '../rxjs';

// NOTE: Query is copy-pasted from 'rx-effects' to not use it as dependency.

/**
 * Provider for a value of a state.
 */
type Query<T> = Readonly<{
  /** Returns the value of a state */
  get: () => T;

  /** `Observable` for value changes.  */
  value$: Observable<T>;
}>;

export type AtomQuery<T> = Query<T> & {
  readonly source: Atom<T>;
};

export function toQuery<T>(source: Atom<T>): AtomQuery<T> {
  return {
    get: () => source(),
    value$: observe(source),
    source,
  };
}

export function fromQuery<T>(query: Query<T>): AtomObservable<T> {
  return fromObservable(query.value$.pipe(skip(1)), query.get());
}
