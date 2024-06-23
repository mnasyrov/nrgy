import { Observable, skip } from 'rxjs';

import {
  Atom,
  compute,
  createScope,
  DestroyableAtom,
  destroySignal,
  signal,
} from '../core';
import { createAtomFromFunction, getAtomNode } from '../core/atom';
import { ENERGY_RUNTIME } from '../core/runtime';
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
    get: () => ENERGY_RUNTIME.runAsUntracked(() => source()),
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
  const onDestroyed = signal<void>({ sync: true });

  const scope = createScope();
  scope.onDestroy(() => {
    onDestroyed();
    destroySignal(onDestroyed);
  });

  const state = scope.atom<State>({ type: StateType.value });

  const changes$ = query.value$.pipe(skip(1));
  scope.add(
    changes$.subscribe({
      next: () => state.set({ type: StateType.value }),
      error: (error: unknown) => state.set({ type: StateType.error, error }),
      complete: () => scope.destroy(),
    }),
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

  return createAtomFromFunction(node, () => result(), {
    onDestroyed,
    destroy: () => scope.destroy(),
    asReadonly: () => result,
  });
}
