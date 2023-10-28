import { Signal } from './common';
import { compute } from './compute';
import { signal, SignalOptions } from './signal';

const enum StateType {
  value,
  error,
}

type State<T> =
  | { type: StateType.value; value: T }
  | { type: StateType.error; error: unknown };

export type SignalObservable<T> = Signal<T> &
  Readonly<{
    destroy: () => void;
    asReadonly(): Signal<T>;
  }>;

export type SignalSubject<T> = SignalObservable<T> &
  Readonly<{
    next: (value: T) => void;
    error: (error: unknown) => void;
    asObservable(): SignalObservable<T>;
  }>;

export function createSignalSubject<T>(
  initialValue: T,
  options?: SignalOptions<T>,
): SignalSubject<T> {
  const state = signal<State<T>>(
    {
      type: StateType.value,
      value: initialValue,
    },
    {
      name: options?.name,
      onDestroy: options?.onDestroy,
    },
  );

  // The actual returned signal is a `computed` of the `State` signal, which maps the various states
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

  Object.assign(result, {
    next: (value: T) => state.set({ type: StateType.value, value }),
    error: (error: unknown) => state.set({ type: StateType.error, error }),

    destroy: () => state.destroy(),

    // TODO
    asObservable: () => result,
    // TODO
    asReadonly: () => result,
  });

  return result as SignalSubject<T>;
}
