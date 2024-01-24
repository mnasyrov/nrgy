import { atom, AtomOptions, createAtomFromFunction, getAtomNode } from './atom';
import { Atom } from './common';
import { compute } from './compute';

const enum StateType {
  value,
  error,
}

type State<T> =
  | { type: StateType.value; value: T }
  | { type: StateType.error; error: unknown };

export type AtomObservable<T> = Atom<T> &
  Readonly<{
    destroy: () => void;
    asReadonly(): Atom<T>;
  }>;

export type AtomSubject<T> = AtomObservable<T> &
  Readonly<{
    next: (value: T) => void;
    error: (error: unknown) => void;
    asObservable(): AtomObservable<T>;
  }>;

export function createAtomSubject<T>(
  initialValue: T,
  options?: AtomOptions<T>,
): AtomSubject<T> {
  const state = atom<State<T>>(
    {
      type: StateType.value,
      value: initialValue,
    },
    {
      name: options?.name,
      onDestroy: options?.onDestroy,
    },
  );

  // The actual returned atom is a `computed` of the `State` atom, which maps the various states
  // to either values or errors.
  const result = compute<T>(
    () => {
      const current = state();

      switch (current.type) {
        case StateType.value:
          return current.value;

        case StateType.error:
          throw current.error;
      }
    },
    {
      equal: options?.equal,
    },
  );

  const destroy = () => state.destroy();
  const asReadonly = () => result;

  let observableAtom: AtomObservable<T> | undefined;

  Object.assign(result, {
    next: (value: T) => state.set({ type: StateType.value, value }),
    error: (error: unknown) => state.set({ type: StateType.error, error }),

    destroy,

    asObservable: () => {
      if (!observableAtom) {
        const node = getAtomNode(result);
        observableAtom = createAtomFromFunction(node, () => result(), {
          destroy,
          asReadonly,
        });
      }
      return observableAtom;
    },

    asReadonly,
  });

  return result as AtomSubject<T>;
}
