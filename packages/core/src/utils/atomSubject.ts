import { atom, compute } from '../reactivity/reactivity';
import type { AtomOptions, DestroyableAtom } from '../reactivity/types';

const STATE_TYPE_VALUE = 0;
const STATE_TYPE_ERROR = 1;

type State<T> =
  | { type: typeof STATE_TYPE_VALUE; value: T }
  | { type: typeof STATE_TYPE_ERROR; error: unknown };

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
      type: STATE_TYPE_VALUE,
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
        case STATE_TYPE_VALUE:
          return current.value;

        case STATE_TYPE_ERROR:
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
    state.set({ type: STATE_TYPE_VALUE, value });
  };
  getter.error = (error: unknown) => {
    state.set({ type: STATE_TYPE_ERROR, error });
  };

  return getter;
}
