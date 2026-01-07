import { atom, compute } from '../reactivity/reactivity';
import { AtomOptions, DestroyableAtom } from '../reactivity/types';

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
  const state = atom<State<T>>(
    {
      type: StateType.value,
      value: initialValue,
    },
    {
      label: options?.label,
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

  const getter = result as any;
  getter.destroy = () => state.destroy();
  getter.next = (value: T) => {
    state.set({ type: StateType.value, value });
  };
  getter.error = (error: unknown) => {
    state.set({ type: StateType.error, error });
  };

  return getter;
}
