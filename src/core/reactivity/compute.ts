import { defaultEquals } from '../common/defaultEquals';
import { appendToList, LinkedList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { getObserverRef, RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import { Atom, Computation, ComputeFn, ComputeOptions } from './types';
import {
  COMPUTED_STATUS_COMPUTING,
  COMPUTED_STATUS_ERROR,
  COMPUTED_STATUS_OK,
  COMPUTED_STATUS_STALE,
  COMPUTED_STATUS_UNSET,
  ComputedNode,
  ObserverRef,
} from './types.internal';

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
    value: undefined as any,
    status: COMPUTED_STATUS_UNSET,
    observers: {},
  };

  const getter = () => getComputedValue(node);
  getter[ATOM_SYMBOL] = node;

  return getter;
};

/** @internal */
export function destroyComputed<T>(node: ComputedNode<T>): void {
  node.value = undefined as any;
  node.status = COMPUTED_STATUS_UNSET;
  node.notifiedAt = undefined;

  node.observers = {};

  if (node._ref) {
    node._ref.node = undefined;
    node._ref = undefined;
  }
}

/** @internal */
export function notifyComputed<T>(
  node: ComputedNode<T>,
): LinkedList<ObserverRef> | undefined {
  if (node.notifiedAt === RUNTIME.clock) {
    return;
  }
  node.notifiedAt = RUNTIME.clock;

  node.status = COMPUTED_STATUS_STALE;

  const observersForNotification = node.observers;
  node.observers = {};

  return observersForNotification;
}

function getComputedValue<T>(node: ComputedNode<T>): T {
  if (node.status === COMPUTED_STATUS_COMPUTING) {
    // Computation results in a cyclic read of itself.
    throw new Error('Detected cycle in computations');
  }

  const isStale =
    node.status === COMPUTED_STATUS_STALE ||
    node.status === COMPUTED_STATUS_UNSET;
  const mustRenewSource = RUNTIME.activeObserver && !node.observers.head;

  if (RUNTIME.activeObserver) {
    appendToList(node.observers, getObserverRef(RUNTIME.activeObserver));
  }

  if (isStale || mustRenewSource) {
    recomputeValue(node);
  }

  if (node.status === COMPUTED_STATUS_ERROR) {
    throw node.error;
  }

  return node.value;
}

/** @internal */
function recomputeValue<T>(node: ComputedNode<T>): boolean {
  const noOldValue =
    node.status === COMPUTED_STATUS_UNSET ||
    node.status === COMPUTED_STATUS_ERROR;
  node.status = COMPUTED_STATUS_COMPUTING;

  try {
    const newValue: T = RUNTIME.runAsTracked(node, node.computation);

    node.status = COMPUTED_STATUS_OK;

    if (noOldValue || !node.equal(node.value, newValue)) {
      node.value = newValue;
      node.version = nextSafeInteger(node.version);
      node.error = undefined;
      return true;
    }
  } catch (err) {
    node.value = undefined as any;
    node.status = COMPUTED_STATUS_ERROR;
    node.version = nextSafeInteger(node.version);
    node.error = err;
  }

  return false;
}
