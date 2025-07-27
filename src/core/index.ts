//
// Common
//

export { defaultEquals } from './common/defaultEquals';
export { objectEquals } from './common/objectEquals';

//
// Reactivity
//

export type {
  Atom,
  AtomFn,
  AtomOptions,
  Computation,
  ComputeOptions,
  EffectCallback,
  EffectFn,
  EffectOptions,
  EffectSubscription,
  ValueEqualityFn,
  WritableAtom,
} from './reactivity/types';

export { atom } from './reactivity/atom';
export { AtomUpdateError } from './reactivity/atomUpdateError';
export { compute } from './reactivity/compute';
export { effect, syncEffect } from './reactivity/effect';

//
// Scope
//

export type {
  Destroyable,
  Scope,
  ScopeTeardown,
  SharedScope,
  Unsubscribable,
} from './scope/types';

export { ScopeDestructionError } from './scope/scopeDestructionError';
export { createScope } from './scope/createScope';

//
// Store
//

export type {
  Store,
  StoreUpdate,
  StoreUpdates,
  StateUpdates,
  StateMutation,
} from './store/store';

export {
  createStore,
  createStoreUpdates,
  declareStateUpdates,
} from './store/store';

export type { StoreFactory, DeclareStoreOptions } from './store/declareStore';
export { declareStore } from './store/declareStore';

//
// Utilities
//

export type { AtomSubject } from './utils/atomSubject';
export { createAtomSubject } from './utils/atomSubject';

export { batch } from './utils/batch';
export { combineAtoms } from './utils/combineAtoms';
export { mapAtom } from './utils/mapAtom';
export { mergeAtoms } from './utils/mergeAtoms';
export { runEffects } from './utils/runEffects';
export { readonlyAtom } from './utils/readonlyAtom';

//
// MVC/MVVM
//

export * from './mvc';
