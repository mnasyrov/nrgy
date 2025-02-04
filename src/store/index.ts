import { StateMutation } from '../core/store/store';

export type {
  Store,
  StoreUpdate,
  StoreUpdates,
  StateUpdates,
  StateMutation,
} from '../core/store/store';
export {
  createStore,
  createStoreUpdates,
  declareStateUpdates,
} from '../core/store/store';

export type {
  StoreFactory,
  DeclareStoreOptions,
} from '../core/store/declareStore';
export { declareStore } from '../core/store/declareStore';

/**
 * @deprecated
 *
 * Returns a mutation which applies all provided mutations for a state.
 *
 * You can use this helper to apply multiple changes at the same time.
 */
export function pipeStateMutations<State>(
  mutations: ReadonlyArray<StateMutation<State>>,
): StateMutation<State> {
  return (state) =>
    mutations.reduce((nextState, mutation) => mutation(nextState), state);
}
