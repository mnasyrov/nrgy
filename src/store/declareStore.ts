import { AtomOptions } from '../core';

import { createStore, StateMutation, StateUpdates, Store } from './store';

/**
 * Options for declaring a store
 */
export type DeclareStoreOptions<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
> = Readonly<{
  initialState: State;
  updates: Updates;
  options?: AtomOptions<State>;
}>;

/**
 * @internal
 */
type FactoryStateArg<State> =
  | (State extends (state: State) => State ? never : State)
  | StateMutation<State>;

/**
 * Factory function for creating a store
 *
 * @param initialState Initial state
 * @param options Options for the store
 */
export type StoreFactory<State, Updates extends StateUpdates<State>> = {
  (
    initialState?: FactoryStateArg<State>,
    options?: AtomOptions<State>,
  ): Store<State, Updates>;

  new (
    initialState?: FactoryStateArg<State>,
    options?: AtomOptions<State>,
  ): Store<State, Updates>;

  /**
   * Initial state
   */
  readonly initialState: State;

  /**
   * State mutators
   */
  readonly updates: Updates;
};

/**
 * declare the base interface for create store
 * @example
```ts
type State = {
  id: string;
  name: string;
  isAdmin: boolean
};
const initialState: State = {
  id: '',
  name: '',
  isAdmin: false
};
const createUserStore = declareStore({
  initialState,
  updates: {
    setId: (id: string) => (state) => {
      return {
        ...state,
        id: id,
      };
    },
    setName: (name: string) => (state) => {
      return {
        ...state,
        name: name,
      };
    },
    update: (id: string name: string) => (state) => {
      return {
        ...state,
        id: id,
        name: name,
      };
    },
    setIsAdmin: () => (state) => {
      return {
        ...state,
        isAdmin: true,
      };
    },
  },
});

const userStore1 = createUserStore({ id: '1', name: 'User 1', isAdmin: false });

const userStore2 = createUserStore({ id: '2', name: 'User 2', isAdmin: true });

// OR

const users = [
  createUserStore({id: 1, name: 'User 1'}),
  createUserStore({id: 2, name: 'User 2'}),
]

userStore1.updates.setName('User from store 1');

assets.isEqual(userStore1.get().name, 'User from store 1')

assets.isEqual(userStore2.get().name, 'User 2')

// type of createUserStore
type UserStore = ReturnType<typeof createUserStore>;
```
 */
export function declareStore<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
>(
  storeOptions: DeclareStoreOptions<State, Updates>,
): StoreFactory<State, Updates> {
  const { initialState, updates, options } = storeOptions;

  function factory(
    customInitialState?: FactoryStateArg<State>,
    customOptions?: AtomOptions<State>,
  ) {
    const state =
      customInitialState === undefined
        ? initialState
        : typeof customInitialState === 'function'
          ? (customInitialState as StateMutation<State>)(initialState)
          : customInitialState;

    const store = createStore(state, { ...options, ...customOptions, updates });

    return store;
  }

  Object.assign(factory, { initialState, updates });

  return factory as StoreFactory<State, Updates>;
}
