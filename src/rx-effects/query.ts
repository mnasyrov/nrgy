import { Observable, skip } from 'rxjs';

import { Atom, compute, createScope, DestroyableAtom } from '../core';
import { createAtomFromFunction, getAtomNode } from '../core/atom';
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
  const source = query.value$.pipe(skip(1));

  const scope = createScope();

  let readonlyAtom: Atom<T> | undefined = undefined;

  const state = scope.atom<State>(
    { type: StateType.value },
    { onDestroy: () => scope.destroy() },
  );

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

  const node = getAtomNode(result);

  const asReadonly = (): Atom<T> => {
    if (readonlyAtom === undefined) {
      readonlyAtom = createAtomFromFunction(node, () => result());
    }
    return readonlyAtom;
  };

  scope.add(
    source.subscribe({
      next: () => state.set({ type: StateType.value }),
      error: (error: unknown) => state.set({ type: StateType.error, error }),
      complete: () => scope.destroy(),
    }),
  );

  const resultAtom: DestroyableAtom<T> = createAtomFromFunction(
    node,
    () => result(),
    {
      destroy: () => scope.destroy(),
      asReadonly,
    },
  );

  return resultAtom;
}
