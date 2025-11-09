import { Observable, skip, Unsubscribable } from 'rxjs';

import { atom, Atom, compute } from '../core';
import { DestroyableAtom } from '../core/reactivity/types';
import { observe } from '../rxjs';

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

const enum StateType {
  value,
  error,
}

type State =
  | { type: StateType.value }
  | { type: StateType.error; error: unknown };

/**
 * Creates an Atom from a Query
 */
export function fromQuery<T>(query: Query<T>): DestroyableAtom<T> {
  let subscription: Unsubscribable | undefined = undefined;

  const state = atom<State>(
    { type: StateType.value },
    { onDestroy: () => subscription?.unsubscribe() },
  );

  subscription = query.value$.pipe(skip(1)).subscribe({
    next: () => state.set({ type: StateType.value }),
    error: (error: unknown) => state.set({ type: StateType.error, error }),
    complete: () => state.destroy(),
  });

  // The actual returned atom is a `computed` of the `State` atom, which maps the various states
  // to either values or errors.
  const result = compute<T>(() => {
    const current = state();

    switch (current.type) {
      case StateType.value:
        return query.get();

      case StateType.error:
        throw current.error;
    }
  });

  (result as any).destroy = () => state.destroy();

  return result as DestroyableAtom<T>;
}
