import { defaultEquals } from '../common/defaultEquals';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import {
  disposeFastArray,
  fastArray,
  FastArray,
  pushFastArray,
  resetFastArray,
} from './fastArray';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
  TaskScheduler,
} from './schedulers';
import {
  Atom,
  AtomFn,
  AtomList,
  AtomOptions,
  Computation,
  ComputeFn,
  ComputeOptions,
  EffectCallback,
  EffectFn,
  EffectOptions,
  SourceAtom,
  ValueEqualityFn,
} from './types';

//
// TYPES and CONSTANTS
//

/**
 * Symbol used to indicate that an object is an Atom
 */
export const ATOM_SYMBOL = Symbol.for('ngry.atom');

/** @internal */
export const ATOM_STATE_ALIVE = 0;
/** @internal */
export const ATOM_STATE_PREDESTROY = 1;
/** @internal */
export const ATOM_STATE_DESTROYED = 2;

/** @internal */
export type AtomState =
  | typeof ATOM_STATE_ALIVE
  | typeof ATOM_STATE_PREDESTROY
  | typeof ATOM_STATE_DESTROYED;

/** @internal */
export const NODE_TYPE_COMPUTED = 1;
/** @internal */
export const NODE_TYPE_EFFECT = 2;

/** @internal */
export type ObserverNode = {
  id: number;
  label: string | undefined;
  ref: ObserverRef | undefined;
  type: typeof NODE_TYPE_COMPUTED | typeof NODE_TYPE_EFFECT;
};

/** @internal */
export type ObserverRef = {
  node: ObserverNode | undefined;
};

/** @internal */
export type ComputedNodeRef = ObserverRef & {
  node: ComputedNode<any> | undefined;
};

/** @internal */
export type EffectNodeRef = ObserverRef & { node: EffectNode<any> | undefined };

/** @internal */
export type BaseSourceNode = {
  id: number;
  label: string | undefined;
  observerRefs: FastArray<ObserverRef>;
  version: number;
};

/** @internal */
export type AtomNode<T> = BaseSourceNode & {
  equal: ValueEqualityFn<T> | undefined;
  onDestroy: (() => void) | undefined;
  state: AtomState;
  value: T;
};

/** @internal */
export const COMPUTED_STATUS_STABLE = 0;
/** @internal */
export const COMPUTED_STATUS_STALE = 1;
/** @internal */
export const COMPUTED_STATUS_COMPUTING = 2;

/** @internal */
export const COMPUTED_VALUE_UNSET = 0;
/** @internal */
export const COMPUTED_VALUE_SET = 1;
/** @internal */
export const COMPUTED_VALUE_ERROR = 2;

/** @internal */
export type ComputedNode<T> = BaseSourceNode &
  ObserverNode & {
    computation: Computation<T>;
    equal: ValueEqualityFn<T> | undefined;
    value: any;
    valueState:
      | typeof COMPUTED_VALUE_UNSET
      | typeof COMPUTED_VALUE_SET
      | typeof COMPUTED_VALUE_ERROR;
    version: number;
    status:
      | typeof COMPUTED_STATUS_STABLE
      | typeof COMPUTED_STATUS_COMPUTING
      | typeof COMPUTED_STATUS_STALE;
  };

/** @internal */
export type EffectNode<T> = ObserverNode & {
  action: EffectCallback<T> | undefined;
  dirty: boolean;
  isDestroyed: boolean;
  lastValueVersion: number | undefined;
  onDestroy: (() => void) | undefined;
  onError: ((error: unknown) => void) | undefined;
  scheduler: TaskScheduler<EffectNode<any>> | undefined;
  sourceAtom: Atom<T> | undefined;
};

//
// RUNTIME
//

/**
 * @internal
 */
export class Runtime {
  readonly asyncScheduler =
    createMicrotaskScheduler<EffectNode<any>>(runEffect);
  readonly syncScheduler = createSyncTaskScheduler<EffectNode<any>>(runEffect);
  readonly microtaskScheduler = createMicrotaskScheduler<() => void>(
    (callback) => callback(),
  );

  nextId = 1;

  /** @readonly */
  activeObserver: ObserverNode | undefined;

  /** @readonly */
  batchLock: number = 0;

  /**
   * Run a function in a tracked context
   */
  runAsTracked<T>(node: ObserverNode, fn: () => T): T {
    const prev = this.activeObserver;
    this.activeObserver = node;

    try {
      return fn();
    } finally {
      this.activeObserver = prev;
    }
  }

  /**
   * Run a function in an untracked context
   */
  runAsUntracked<T>(fn: () => T): T {
    const prev = this.activeObserver;
    this.activeObserver = undefined;

    try {
      return fn();
    } finally {
      this.activeObserver = prev;
    }
  }

  batch<T>(fn: () => T): T {
    try {
      this.batchLock++;

      if (this.batchLock === 1) {
        this.syncScheduler.pause();
        this.asyncScheduler.pause();
        this.microtaskScheduler.pause();
      }

      return fn();
    } finally {
      this.batchLock--;

      if (this.batchLock === 0) {
        this.syncScheduler.resume();
        this.asyncScheduler.resume();
        this.microtaskScheduler.resume();
      }
    }
  }

  runEffects() {
    this.syncScheduler.execute();
    this.asyncScheduler.execute();
    this.microtaskScheduler.execute();
  }
}

/**
 * @internal
 *
 * The energy runtime
 */
export const RUNTIME = new Runtime();

//
// UTILS
//

/** @internal */
export function isComputedNode(node: ObserverNode): node is ComputedNode<any> {
  return node.type === NODE_TYPE_COMPUTED;
}

/** @internal */
export function isEffectNode(node: ObserverNode): node is EffectNode<any> {
  return node.type === NODE_TYPE_EFFECT;
}

/** @internal */
export function getNodeLabel(node: { id: number; label?: string }): string {
  return node.label ?? `#${node.id}`;
}

/** @internal */
export function getSourceAtomNodeLabel(node: {
  id: number;
  label?: string;
}): string {
  return `SourceAtom ${getNodeLabel(node)}`;
}

/** @internal */
export function getObserverRef(node: ObserverNode): ObserverRef {
  if (!node.ref) {
    node.ref = { node };
  }
  return node.ref;
}

/** @internal */
function destroySelfObserverRef(node: ObserverNode): void {
  if (node.ref) {
    node.ref.node = undefined;
    node.ref = undefined;
  }
}

/** @internal */
export function appendObserverToNode(
  node: BaseSourceNode,
  observer: ObserverNode,
): void {
  pushFastArray(node.observerRefs, getObserverRef(observer));
}

/**
 * Creates a new Atom which takes the latest values from source atoms
 * and combines them into an array.
 */
export function combineAtoms<TValues extends unknown[]>(
  sources: AtomList<TValues>,
  options?: ComputeOptions<TValues>,
): Atom<TValues> {
  return compute<TValues>(
    () => sources.map((source) => source()) as TValues,
    options,
  );
}

//
// ATOM
//

/**
 * Error thrown when an attempt is made to update an atom in a tracked context.
 */
export class AtomUpdateError extends Error {
  constructor(name?: string) {
    super(
      'Atom cannot be updated in tracked context' + (name ? ` (${name})` : ''),
    );
    this.name = 'AtomUpdateError';
  }
}

/**
 * Checks if the given `value` is a reactive `Atom`.
 */
export function isAtom<T>(value: unknown): value is Atom<T> {
  return (
    typeof value === 'function' && (value as any)[ATOM_SYMBOL] !== undefined
  );
}

/**
 * @internal
 *
 * Returns `AtomNode` from the given Atom.
 */
export function getAtomNode<T>(value: Atom<T>): AtomNode<T> {
  return (value as any)[ATOM_SYMBOL] as AtomNode<T>;
}

/**
 * Returns a name of the given Atom.
 */
export function getAtomLabel(value: Atom<any>): string | undefined {
  return getAtomNode(value).label;
}

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export const atom: AtomFn = function <T>(
  initialValue: T,
  options?: AtomOptions<T>,
): SourceAtom<T> {
  const node: AtomNode<T> = {
    equal: options?.equal,
    id: RUNTIME.nextId++,
    label: options?.label,
    observerRefs: fastArray(),
    onDestroy: options?.onDestroy,
    state: ATOM_STATE_ALIVE,
    value: initialValue,
    version: 0,
  };

  const getter = () => getAtomValue(node);
  getter[ATOM_SYMBOL] = node;
  getter.destroy = () => destroyAtom(node);
  getter.set = (value: T) => setAtomValue(node, value);
  getter.update = (updater: (value: T) => T) => updateAtomValue(node, updater);
  getter.mutate = (mutator: (value: T) => void) =>
    mutateAtomValue(node, mutator);

  return getter;
};

function destroyObserverRefs(sourceNode: BaseSourceNode): void {
  const list = sourceNode.observerRefs;
  const len = list[0];
  for (let i = 1; i <= len; i++) {
    const node = (list[i] as ObserverRef)?.node;
    list[i] = undefined as any;

    if (!node) {
      continue;
    }

    if (node.type === NODE_TYPE_COMPUTED) {
      destroyComputed(node as ComputedNode<any>);
    } else {
      destroyEffect(node as any);
    }
  }
  disposeFastArray(sourceNode.observerRefs);
}

/** @internal */
function destroyAtom<T>(node: AtomNode<T>): void {
  if (node.state !== ATOM_STATE_ALIVE) {
    return;
  }
  node.state = ATOM_STATE_PREDESTROY;

  destroyObserverRefs(node);
  node.onDestroy?.();
  node.state = ATOM_STATE_DESTROYED;
}

function getAtomValue<T>(node: AtomNode<T>): T {
  if (node.state === ATOM_STATE_ALIVE && RUNTIME.activeObserver) {
    appendObserverToNode(node, RUNTIME.activeObserver);
  }

  return node.value;
}

function setAtomValue<T>(node: AtomNode<T>, newValue: T | undefined): void {
  if (node.state === ATOM_STATE_ALIVE && RUNTIME.activeObserver) {
    throw new AtomUpdateError(getSourceAtomNodeLabel(node));
  }

  if (node.state !== ATOM_STATE_DESTROYED) {
    const equal = node.equal ?? defaultEquals;
    const isChanged = !equal(node.value, newValue!);
    if (isChanged) {
      node.value = newValue!;
      commitAtomValue(node);
    }
  }
}

function mutateAtomValue<T>(
  node: AtomNode<T>,
  mutator: (value: T) => void,
): void {
  if (node.state === ATOM_STATE_ALIVE && RUNTIME.activeObserver) {
    throw new AtomUpdateError(getSourceAtomNodeLabel(node));
  }

  if (node.state !== ATOM_STATE_DESTROYED) {
    mutator(node.value);
    commitAtomValue(node);
  }
}

function updateAtomValue<T>(node: AtomNode<T>, updater: (value: T) => T): void {
  const nextValue = updater(node.value);
  setAtomValue(node, nextValue);
}

function commitAtomValue<T>(node: AtomNode<T>): void {
  node.version = nextSafeInteger(node.version);

  if (node.state !== ATOM_STATE_ALIVE || node.observerRefs[0] === 0) {
    return;
  }

  propagateAtomChanges(node);
}

// Global queues for propagation to avoid allocations
const GLOBAL_EFFECT_QUEUE = fastArray<EffectNode<any>>();
const GLOBAL_PROPAGATION_QUEUE = fastArray<BaseSourceNode>();

// Notify all observers of this producer that its value is changed
function propagateAtomChanges(sourceNode: AtomNode<any>): void {
  // Fast path: nothing depends on this source
  if (sourceNode.observerRefs[0] === 0) return;

  // Clear queues for reuse
  resetFastArray(GLOBAL_EFFECT_QUEUE);
  resetFastArray(GLOBAL_PROPAGATION_QUEUE);

  // Start BFS from the source node
  pushFastArray(GLOBAL_PROPAGATION_QUEUE, sourceNode);

  // Breadth-first invalidation: traverse through computed nodes to reach effects
  for (let i = 1; i <= GLOBAL_PROPAGATION_QUEUE[0]; i++) {
    const src = GLOBAL_PROPAGATION_QUEUE[i] as BaseSourceNode;
    // Steal current observers list from the source to avoid re-processing
    const observerRefs = src.observerRefs;

    for (let j = 1; j <= observerRefs[0]; j++) {
      const node = (observerRefs[j] as ObserverRef)?.node;
      if (!node) continue;

      if (isComputedNode(node)) {
        if (node.status !== COMPUTED_STATUS_STALE) {
          node.status = COMPUTED_STATUS_STALE;
          // Enqueue computed node to propagate further to its own dependents
          pushFastArray(GLOBAL_PROPAGATION_QUEUE, node);
        }
      } else {
        pushFastArray(GLOBAL_EFFECT_QUEUE, node);
      }
    }

    resetFastArray(src.observerRefs);
  }

  // Notify effects
  for (let i = 1; i <= GLOBAL_EFFECT_QUEUE[0]; i++) {
    notifyEffect(GLOBAL_EFFECT_QUEUE[i] as EffectNode<any>);
  }

  // Clear arrays to release references
  resetFastArray(GLOBAL_EFFECT_QUEUE);
  resetFastArray(GLOBAL_PROPAGATION_QUEUE);
}

//
// COMPUTE
//

/**
 * Create a computed `Atom` which derives a reactive value from an expression.
 *
 * @param computation A pure function that returns a value
 * @param options ComputeOptions
 */
export const compute: ComputeFn = function <T>(
  computation: Computation<T>,
  options?: ComputeOptions<T>,
): Atom<T> {
  const node: ComputedNode<T> = {
    computation: computation,
    equal: options?.equal,
    id: RUNTIME.nextId++,
    label: options?.label,
    observerRefs: fastArray(),
    ref: undefined,
    status: COMPUTED_STATUS_STALE,
    type: NODE_TYPE_COMPUTED,
    value: undefined as any,
    valueState: COMPUTED_VALUE_UNSET,
    version: 0,
  };

  const getter = () => getComputedValue(node);
  getter[ATOM_SYMBOL] = node;

  return getter;
};

/** @internal */
export function destroyComputed<T>(node: ComputedNode<T>): void {
  node.status = COMPUTED_STATUS_STALE;
  node.value = undefined as any;
  node.valueState = COMPUTED_VALUE_UNSET;

  destroyObserverRefs(node);
  destroySelfObserverRef(node);
}

function getComputedValue<T>(node: ComputedNode<T>): T {
  if (node.status === COMPUTED_STATUS_COMPUTING) {
    // Computation results in a cyclic read of itself.
    throw new Error('Detected cycle in computations');
  }

  if (RUNTIME.activeObserver) {
    appendObserverToNode(node, RUNTIME.activeObserver);
  }

  if (
    node.status === COMPUTED_STATUS_STALE ||
    node.valueState === COMPUTED_VALUE_ERROR
  ) {
    recomputeValue(node);
  }

  if (node.valueState === COMPUTED_VALUE_ERROR) {
    throw node.value;
  }

  return node.value;
}

/** @internal */
function recomputeValue<T>(node: ComputedNode<T>): boolean {
  const prevObserver = RUNTIME.activeObserver;
  RUNTIME.activeObserver = node;

  node.status = COMPUTED_STATUS_COMPUTING;

  try {
    const newValue: T = node.computation();

    node.status = COMPUTED_STATUS_STABLE;

    const equal = node.equal ?? defaultEquals;
    if (
      node.valueState !== COMPUTED_VALUE_SET ||
      !equal(node.value, newValue)
    ) {
      node.value = newValue;
      node.valueState = COMPUTED_VALUE_SET;
      node.version = nextSafeInteger(node.version);
      return true;
    }
  } catch (err) {
    node.status = COMPUTED_STATUS_STABLE;
    node.value = err;
    node.valueState = COMPUTED_VALUE_ERROR;
    node.version = nextSafeInteger(node.version);
    return true;
  } finally {
    RUNTIME.activeObserver = prevObserver;
  }

  return false;
}

//
// EFFECT
//

/**
 * Creates a new synchronous effect
 */
export const syncEffect: EffectFn = function <T>(
  source: Atom<T> | AtomList<T[]>,
  callback: EffectCallback<T>,
  options?: EffectOptions,
) {
  return effect(source as any, callback, { sync: true, ...options });
};

/**
 * Creates a new effect
 */
export const effect: EffectFn = function <T>(
  sourceArg: Atom<T> | AtomList<T[]>,
  callback: EffectCallback<T>,
  options?: EffectOptions,
) {
  const sourceAtom: Atom<any> = Array.isArray(sourceArg)
    ? combineAtoms(sourceArg)
    : sourceArg;

  const scheduler = options?.sync
    ? RUNTIME.syncScheduler
    : RUNTIME.asyncScheduler;

  let fxCallback: EffectCallback<T> = callback;

  if (options?.waitChanges) {
    let skipFirst = true;

    fxCallback = (value) => {
      if (skipFirst) {
        skipFirst = false;
      } else {
        callback(value);
      }
    };
  }

  const node: EffectNode<T> = {
    action: fxCallback,
    dirty: true,
    id: RUNTIME.nextId++,
    isDestroyed: false,
    label: options?.label,
    lastValueVersion: undefined,
    onDestroy: options?.onDestroy,
    onError: options?.onError,
    ref: undefined,
    scheduler,
    sourceAtom,
    type: NODE_TYPE_EFFECT,
  };

  scheduler.schedule(node);

  return {
    destroy: () => destroyEffect(node),
  };
};

/**
 * @internal
 *
 * Destroys the effect
 */
export function destroyEffect<T>(node: EffectNode<T>): void {
  if (node.isDestroyed) {
    return;
  }

  node.isDestroyed = true;
  node.scheduler = undefined;
  node.sourceAtom = undefined;
  node.action = undefined;

  destroySelfObserverRef(node);

  node.onDestroy?.();
  node.onDestroy = undefined;
}

/**
 * @internal
 *
 * Schedule the effect to be re-run
 */
export function notifyEffect<T>(node: EffectNode<T>): void {
  if (node.isDestroyed) {
    return;
  }

  const needsSchedule = !node.dirty;
  node.dirty = true;

  if (needsSchedule && node.scheduler) {
    node.scheduler.schedule(node);
  }
}

/**
 * @internal
 *
 * Execute the reactive expression in the context of this `AtomEffect`.
 *
 * Should be called by the user scheduling algorithm when the provided
 * `scheduler` TaskScheduler is called.
 */
export function runEffect<T>(node: EffectNode<T>): void {
  if (!node.dirty) {
    return;
  }

  node.dirty = false;

  if (node.isDestroyed || !node.action || !node.sourceAtom) {
    return;
  }

  let sourceValue: any;
  let resultError;
  let isResultError;

  try {
    sourceValue = RUNTIME.runAsTracked(node, node.sourceAtom);
  } catch (error) {
    isResultError = true;
    resultError = error;
  }

  try {
    if (node.isDestroyed) {
      return;
    }

    const sourceVersion = getAtomNode(node.sourceAtom).version;
    if (node.lastValueVersion === sourceVersion) {
      // Value is not changed
      return;
    }
    node.lastValueVersion = sourceVersion;

    if (!isResultError) {
      node.action(sourceValue);
    }
  } catch (error) {
    isResultError = true;
    resultError = error;
  }

  if (isResultError) {
    node.onError?.(resultError);
    return;
  }
}
