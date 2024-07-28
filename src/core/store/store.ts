import { AtomOptions, WritableAtom } from '../atoms/atom';
import { atom } from '../atoms/writableAtom';

/**
 * A function to update a state.
 *
 * It is recommended to return a new state or the previous one.
 *
 * Actually, the function can change the state in place, but it is responsible
 * for a developer to provide `comparator` function to the store which handles
 * the changes.
 *
 * For making changes use a currying function to provide arguments:
 * ```ts
 * const addPizzaToCart = (name: string): StateMutation<Array<string>> =>
 *   (state) => ([...state, name]);
 * ```
 *
 * @param state a previous state
 * @returns a next state
 */
export type StateMutation<State> = (state: State) => State;

/**
 * A record of factories which create state mutations.
 */
export type StateUpdates<State> = Readonly<
  Record<string, (...args: any[]) => StateMutation<State>>
>;

/**
 * Declare a record of factories for creating state mutations.
 */
export function declareStateUpdates<State>(): <
  Updates extends StateUpdates<State> = StateUpdates<State>,
>(
  updates: Updates,
) => Updates;

/**
 * Declare a record of factories for creating state mutations.
 */
export function declareStateUpdates<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
>(stateExample: State, updates: Updates): Updates;

export function declareStateUpdates<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
>(
  stateExample?: State,
  updates?: Updates,
):
  | Updates
  | (<Updates extends StateUpdates<State> = StateUpdates<State>>(
      updates: Updates,
    ) => Updates) {
  if (updates) {
    return updates;
  }

  return (updates) => updates;
}

/**
 * Function which changes a state of the store
 */
export type StoreUpdate<Args extends unknown[]> = (...args: Args) => void;

/**
 * Record of store update functions
 */
export type StoreUpdates<
  State,
  Updates extends StateUpdates<State>,
> = Readonly<{
  [K in keyof Updates]: StoreUpdate<Parameters<Updates[K]>>;
}>;

/**
 * Store and updating functions
 */
export type Store<
  State,
  Updates extends StateUpdates<State>,
> = WritableAtom<State> & { readonly updates: StoreUpdates<State, Updates> };

export type StoreOptions<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
> = AtomOptions<State> & {
  updates: Updates;
};

/**
 * Creates the state store.
 *
 * @param initialState Initial state
 * @param options Options for the store
 */
export function createStore<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
>(
  initialState: State,
  options: StoreOptions<State, Updates>,
): Store<State, Updates> {
  const store = atom<State>(initialState, options) as any;

  store.updates = createStoreUpdates<State, Updates>(
    store.update,
    options.updates,
  );

  return store;
}

/**
 * Creates StateUpdates for updating the store by provided state mutations
 */
export function createStoreUpdates<State, Updates extends StateUpdates<State>>(
  atomUpdate: WritableAtom<State>['update'],
  stateUpdates: Updates,
): StoreUpdates<State, Updates> {
  const updates: any = {};

  Object.entries(stateUpdates).forEach(([key, mutationFactory]) => {
    (updates as any)[key] = (...args: any[]) => {
      const mutation = mutationFactory(...args);

      atomUpdate(mutation);
    };
  });

  return updates;
}
