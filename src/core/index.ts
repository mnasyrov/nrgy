//
// Common
//

export type {
  Atom,
  DestroyableAtom,
  Signal,
  ValueEqualityFn,
} from './common/types';
export { defaultEquals } from './common/defaultEquals';

//
// Signals
//

export type { SignalOptions, SignalFn } from './signals/types';
export {
  isSignalSubscribed,
  isSignalDestroyed,
  destroySignal,
  getSignalName,
  isSignal,
} from './signals/common';
export { signal } from './signals/signal';

//
// Atoms
//

export type { AtomFn } from './atoms/types';

export type { AtomOptions, WritableAtom } from './atoms/atom';
export { isAtom, getAtomName, AtomUpdateError } from './atoms/atom';

export { atom } from './atoms/writableAtom';

export type { Computation, ComputeOptions } from './atoms/compute';
export { compute } from './atoms/compute';

//
// Effects
//

export type {
  EffectAction,
  EffectContext,
  EffectFn,
  EffectOptions,
  EffectSubscription,
} from './effects/types';
export { effect, syncEffect } from './effects/effect';

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
// Utilities
//

export type { AtomSubject } from './utils/atomSubject';
export { createAtomSubject } from './utils/atomSubject';

export { batch } from './utils/batch';
export { combineAtoms } from './utils/combineAtoms';
export { keepLastValue } from './utils/keepLastValue';
export { mapAtom } from './utils/mapAtom';
export { mergeAtoms } from './utils/mergeAtoms';
export { mixSignals } from './utils/mixSignals';
export { objectEquals } from './utils/objectEquals';
export { runEffects } from './utils/runEffects';
export { signalChanges } from './utils/signalChanges';
