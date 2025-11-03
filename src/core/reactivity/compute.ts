import { defaultEquals } from '../common/defaultEquals';
import { DataRef } from '../common/utilityTypes';
import { LinkedList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import { Atom, Computation, ComputeFn, ComputeOptions } from './types';
import { ComputedNode, ObserverNode } from './types.internal';

/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as atom's value.
 */
const UNSET: any = Symbol('UNSET');

/**
 * A dedicated symbol used in place of a computed atom value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as atom's value.
 */
const COMPUTING: any = Symbol('COMPUTING');

/**
 * A dedicated symbol used in place of a computed atom value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as atom's value.
 */
const ERRORED: any = Symbol('ERRORED');

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
    value: UNSET,
    consumers: new LinkedList<DataRef<ObserverNode>>(),

    get: () => getComputedValue(node),
    getRef: () => getRef(node),
    onSourceUpdated: () => notifyComputed(node),
    onSourceDestroy: () => destroyComputed(node),
  };

  const getter = node.get as any;
  getter[ATOM_SYMBOL] = node;

  return getter;
};

function destroyComputed<T>(node: ComputedNode<T>): void {
  node.value = UNSET;
  node.notifiedAt = undefined;

  node.consumers.forEach((ref) => ref.value?.onSourceDestroy());
  node.consumers.clear();

  if (node._ref) {
    node._ref.value = undefined;
    node._ref = undefined;
  }
}

function getRef<T>(node: ComputedNode<T>): DataRef<ObserverNode> {
  if (!node._ref) {
    node._ref = { value: node };
  }
  return node._ref;
}

function notifyComputed<T>(node: ComputedNode<T>): void {
  if (node.notifiedAt === RUNTIME.clock) {
    return;
  }
  node.notifiedAt = RUNTIME.clock;

  const consumerRefs = node.consumers.head;
  node.consumers.clear();

  let item = consumerRefs;
  while (item) {
    item.value.value?.onSourceUpdated();
    item = item.next;
  }
}

function getComputedValue<T>(node: ComputedNode<T>): T {
  const trackingMode: boolean = !!RUNTIME.activeObserver;

  if (node.value === COMPUTING) {
    // Computation results in a cyclic read of itself.
    throw new Error('Detected cycle in computations');
  }

  const isStale = node.clock !== RUNTIME.clock || node.value === UNSET;
  const mustRenewSource = RUNTIME.activeObserver && node.consumers.isEmpty();

  if (RUNTIME.activeObserver) {
    node.consumers.add(RUNTIME.activeObserver.getRef());
  }

  if (isStale || mustRenewSource) {
    recomputeValue(node, trackingMode);
  }

  if (node.value === ERRORED) {
    throw node.error;
  }

  return node.value;
}

function recomputeValue<T>(node: ComputedNode<T>, trackingMode: boolean): void {
  const oldValue = node.value;
  node.value = COMPUTING;

  let newValue: T;

  try {
    newValue = trackingMode
      ? RUNTIME.runAsTracked(node, node.computation)
      : node.computation();
  } catch (err) {
    newValue = ERRORED;
    node.error = err;
  }

  // As we're re-running the computation, update our dependent tracking version number.
  node.clock = RUNTIME.clock;

  if (
    oldValue === UNSET ||
    oldValue === ERRORED ||
    newValue === ERRORED ||
    !node.equal(oldValue, newValue)
  ) {
    node.value = newValue;
    node.version = nextSafeInteger(node.version);
  } else {
    // No change to `valueVersion` - old and new values are
    // semantically equivalent.
    node.value = oldValue;
  }
}
