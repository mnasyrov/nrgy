import { defaultEquals } from '../common/defaultEquals';
import {
  appendListToEnd,
  appendToList,
  LinkedList,
  popListHead,
} from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

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
export type ObserverNode = {
  id: number;
  label?: string;

  ref?: ObserverRef;
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
  label?: string;
  version: number;
  observerRefs: LinkedList<ComputedNodeRef>;
};

/** @internal */
export type AtomNode<T> = BaseSourceNode & {
  equal: ValueEqualityFn<T>;
  onDestroy?: () => void;
  value: T;
  state: AtomState;
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
    version: number;

    computation: Computation<T>;
    equal: ValueEqualityFn<T>;

    value: any;
    valueState:
      | typeof COMPUTED_VALUE_UNSET
      | typeof COMPUTED_VALUE_SET
      | typeof COMPUTED_VALUE_ERROR;

    status:
      | typeof COMPUTED_STATUS_STABLE
      | typeof COMPUTED_STATUS_COMPUTING
      | typeof COMPUTED_STATUS_STALE;
  };

/** @internal */
export type EffectNode<T> = ObserverNode & {
  lastValueVersion?: number;
  dirty: boolean;
  isDestroyed: boolean;

  scheduler?: TaskScheduler;
  sourceAtom?: Atom<T>;
  action?: EffectCallback<T>;

  onError?: (error: unknown) => void;
  onDestroy?: () => void;
};

//
// RUNTIME
//

/**
 * @internal
 */
export class Runtime {
  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

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
      }

      return fn();
    } finally {
      this.batchLock--;

      if (this.batchLock === 0) {
        this.syncScheduler.resume();
        this.asyncScheduler.resume();
      }
    }
  }

  runEffects() {
    this.syncScheduler.execute();
    this.asyncScheduler.execute();
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
  return (node as ComputedNode<any>).computation !== undefined;
}

/** @internal */
export function isEffectNode(node: ObserverNode): node is EffectNode<any> {
  return (node as EffectNode<any>).sourceAtom !== undefined;
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
  appendToList(node.observerRefs, getObserverRef(observer));
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
    typeof value === 'function' &&
    ATOM_SYMBOL in value &&
    value[ATOM_SYMBOL] !== undefined
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
    id: RUNTIME.nextId++,
    label: options?.label,

    version: 0,
    equal: options?.equal ?? defaultEquals,
    onDestroy: options?.onDestroy,
    value: initialValue,
    state: ATOM_STATE_ALIVE,

    observerRefs: {},
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
  let p = sourceNode.observerRefs.head;
  while (p) {
    const node = p.value.node;

    if (!node) return;

    if (isComputedNode(node)) {
      destroyComputed(node);
    } else {
      destroyEffect(node);
    }

    p = p.next;
  }
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
    const isChanged = !node.equal(node.value, newValue!);
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

  if (node.state !== ATOM_STATE_ALIVE || !node.observerRefs.head) {
    return;
  }

  propagateAtomChanges(node);
}

// Notify all observers of this producer that its value is changed
function propagateAtomChanges(sourceNode: AtomNode<any>): void {
  const effectQueue: LinkedList<EffectNode<any>> = {};

  const observerRefsQueue = sourceNode.observerRefs;
  sourceNode.observerRefs = {};

  let observerRef: ObserverRef | undefined;
  while ((observerRef = popListHead(observerRefsQueue))) {
    const node = observerRef?.node;
    if (!node) continue;

    if (isComputedNode(node)) {
      if (node.status === COMPUTED_STATUS_STALE) continue;

      appendListToEnd(observerRefsQueue, node.observerRefs);
      node.status = COMPUTED_STATUS_STALE;
      node.observerRefs = {};
    } else {
      appendToList(effectQueue, node);
    }
  }

  let effectNode: EffectNode<any> | undefined;
  while ((effectNode = popListHead(effectQueue))) {
    notifyEffect(effectNode);
  }
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
    id: RUNTIME.nextId++,
    label: options?.label,

    computation: computation,
    equal: options?.equal ?? defaultEquals,

    version: 0,
    status: COMPUTED_STATUS_STALE,
    value: undefined as any,
    valueState: COMPUTED_VALUE_UNSET,

    observerRefs: {},
  };

  const getter = () => getComputedValue(node);
  getter[ATOM_SYMBOL] = node;

  return getter;
};

/** @internal */
export function destroyComputed<T>(node: ComputedNode<T>): void {
  node.status = COMPUTED_STATUS_STALE;
  node.value = undefined as any;
  node.valueState = COMPUTED_STATUS_STALE;

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

    if (
      node.valueState !== COMPUTED_VALUE_SET ||
      !node.equal(node.value, newValue)
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
    id: RUNTIME.nextId++,
    label: options?.label,
    isDestroyed: false,

    // Effect starts dirty.
    dirty: true,

    scheduler,
    action: fxCallback,
    sourceAtom,
    onError: options?.onError,
    onDestroy: options?.onDestroy,
  };

  scheduler.schedule(() => runEffect(node));

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
    node.scheduler.schedule(() => runEffect(node));
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
