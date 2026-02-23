//
// Common
//

export { defaultEquals } from './common/defaultEquals';
export { objectEquals } from './common/objectEquals';
export { type ValueEqualityFn } from './common/types';

//
// Reactivity
//

export {
  atom,
  combineAtoms,
  compute,
  effect,
  getAtomLabel,
  isAtom,
  syncEffect,
} from './reactivity/reactivity';
export type {
  Atom,
  AtomFn,
  AtomOptions,
  Computation,
  ComputeOptions,
  DestroyableAtom,
  EffectCallback,
  EffectFn,
  EffectOptions,
  EffectSubscription,
  SourceAtom,
} from './reactivity/types';

//
// Scope
//

export { createScope } from './scope/createScope';

export { ScopeDestructionError } from './scope/scopeDestructionError';
export type {
  Destroyable,
  Scope,
  ScopeTeardown,
  SharedScope,
  Unsubscribable,
} from './scope/types';

//
// Utilities
//

export type { AtomSubject } from './utils/atomSubject';
export { createAtomSubject } from './utils/atomSubject';

export { batch } from './utils/batch';
export { mapAtom } from './utils/mapAtom';
export { mergeAtoms } from './utils/mergeAtoms';
export { readonlyAtom } from './utils/readonlyAtom';
export { runEffects } from './utils/runEffects';

//
// MVC/MVVM
//

export * from './mvc/index';
