import {
  AtomOptions,
  createAtomFromFunction,
  getAtomNode,
} from '../atoms/atom';
import { compute } from '../atoms/compute';
import { atom } from '../atoms/writableAtom';
import { Atom, DestroyableAtom } from '../common/types';

const enum StateType {
  value,
  error,
}

type State<T> =
  | { type: StateType.value; value: T }
  | { type: StateType.error; error: unknown };

/**
 * An atom that emits values and errors.
 */
export type AtomSubject<T> = DestroyableAtom<T> &
  Readonly<{
    /** Emits a new value */
    next: (value: T) => void;

    /** Emits an error */
    error: (error: unknown) => void;

    /** Returns an atom that can be used to destroy the subject */
    asDestroyable(): DestroyableAtom<T>;
  }>;

/**
 * Creates an atom that emits values and errors.
 *
 * @param initialValue The initial value
 * @param options AtomOptions
 */
export function createAtomSubject<T>(
  initialValue: T,
  options?: AtomOptions<T>,
): AtomSubject<T> {
  let readonlyAtom: Atom<T> | undefined = undefined;

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

  const onDestroyed = state.onDestroyed;
  const destroy = () => state.destroy();

  const node = getAtomNode(result);
  let observableAtom: DestroyableAtom<T> | undefined;

  const asReadonly = (): Atom<T> => {
    if (readonlyAtom === undefined) {
      readonlyAtom = createAtomFromFunction(node, () => result());
    }
    return readonlyAtom;
  };

  const resultAtom = createAtomFromFunction(node, () => result(), {
    next: (value: T) => state.set({ type: StateType.value, value }),
    error: (error: unknown) => state.set({ type: StateType.error, error }),

    onDestroyed,
    destroy,

    asDestroyable: () => {
      if (!observableAtom) {
        const node = getAtomNode(result);
        observableAtom = createAtomFromFunction(node, () => result(), {
          onDestroyed,
          destroy,
          asReadonly,
        });
      }
      return observableAtom;
    },

    asReadonly,
  });

  return resultAtom;
}
