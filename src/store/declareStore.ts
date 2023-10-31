import { AtomOptions } from '../core/atom';

import { createStore, StateMutation, StateUpdates, Store } from './store';

export type DeclareStoreOptions<
  State,
  Updates extends StateUpdates<State> = StateUpdates<State>,
> = Readonly<{
  initialState: State;
  updates: Updates;
  options?: AtomOptions<State>;
}>;

type FactoryStateArg<State> =
  | (State extends (state: State) => State ? never : State)
  | StateMutation<State>;

export type StoreFactory<State, Updates extends StateUpdates<State>> = {
  (
    initialState?: FactoryStateArg<State>,
    options?: AtomOptions<State>,
  ): Store<State, Updates>;

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
  const {
    initialState: baseState,
    updates,
    options: baseOptions,
  } = storeOptions;

  function factory(
    initialState?: FactoryStateArg<State>,
    atomOptions?: AtomOptions<State>,
  ) {
    const state =
      initialState === undefined
        ? baseState
        : typeof initialState === 'function'
        ? (initialState as StateMutation<State>)(baseState)
        : initialState;

    const store = createStore(state, {
      ...baseOptions,
      ...atomOptions,
      updates,
    });

    return store;
  }

  return Object.assign(factory, { updates });
}
