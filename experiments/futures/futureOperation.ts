import { atom, Atom, compute } from '../../src/core';

export type FutureResult<Value, Error = unknown> =
  | { readonly type: 'initial' }
  | { readonly type: 'pending' }
  | { readonly type: 'success'; readonly value: Value }
  | { readonly type: 'error'; readonly error: Error };

export const FUTURE_RESULT_INITIAL: FutureResult<never, never> = {
  type: 'initial',
};
export const FUTURE_RESULT_PENDING: FutureResult<never, never> = {
  type: 'pending',
};

export type FutureOperation<Event, Result, Error = unknown> = {
  (event: Event): Atom<FutureResult<Result, Error>>;

  readonly pendingCount: Atom<number>;
  readonly pending: Atom<boolean>;
};

const increaseCount = (count: number): number => count + 1;
const decreaseCount = (count: number): number => (count > 0 ? count - 1 : 0);

export function futureOperation<Event, Result, Error = unknown>(
  action: (event: Event) => Result | Promise<Result>,
): FutureOperation<Event, Result, Error> {
  const pendingCount = atom(0);
  const pending = compute(() => pendingCount() > 0);

  const fn = (event: Event) => {
    const state = atom<FutureResult<Result, Error>>(FUTURE_RESULT_PENDING);

    pendingCount.update(increaseCount);

    try {
      const result = action(event);

      if (result instanceof Promise) {
        result
          .then((value) => state.set({ type: 'success', value }))
          .catch((error) => state.set({ type: 'error', error }))
          .finally(() => pendingCount.update(decreaseCount));
      } else {
        state.set({ type: 'success', value: result });
        pendingCount.update(decreaseCount);
      }
    } catch (error) {
      state.set({ type: 'error', error: error as any });
    }

    return state;
  };

  const operation = Object.assign(fn, {
    pendingCount: pendingCount.asReadonly(),
    pending,
  });

  return operation;
}
