import { type Atom, atom, compute, type DestroyableAtom } from '@nrgyjs/core';
import { observe } from '@nrgyjs/rxjs';
import { Observable, skip, type Unsubscribable } from 'rxjs';

// NOTE: Query is copy-pasted from 'rx-effects' to not use it as a dependency.

/**
 * Provider for the value of a state.
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

const STATE_TYPE_VALUE = 0;
const STATE_TYPE_ERROR = 1;

type State =
  | { type: typeof STATE_TYPE_VALUE }
  | { type: typeof STATE_TYPE_ERROR; error: unknown };

/**
 * Creates an Atom from a Query
 */
export function fromQuery<T>(query: Query<T>): DestroyableAtom<T> {
  let subscription: Unsubscribable | undefined = undefined;

  const state = atom<State>(
    { type: STATE_TYPE_VALUE },
    { onDestroy: () => subscription?.unsubscribe() },
  );

  subscription = query.value$.pipe(skip(1)).subscribe({
    next: () => state.set({ type: STATE_TYPE_VALUE }),
    error: (error: unknown) => state.set({ type: STATE_TYPE_ERROR, error }),
    complete: () => state.destroy(),
  });

  // The actual returned atom is a `computed` of the `State` atom, which maps the various states
  // to either values or errors.
  const result = compute<T>(() => {
    const current = state();

    switch (current.type) {
      case STATE_TYPE_VALUE:
        return query.get();

      case STATE_TYPE_ERROR:
        throw current.error;
    }
  });

  (result as any).destroy = () => state.destroy();

  return result as DestroyableAtom<T>;
}
