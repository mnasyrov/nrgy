import { defaultEquals } from '../common/defaultEquals';
import { forEachInList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import { Atom, Computation, ComputeFn, ComputeOptions } from './types';
import {
  COMPUTED_STATUS_COMPUTING,
  COMPUTED_STATUS_STABLE,
  COMPUTED_STATUS_STALE,
  COMPUTED_VALUE_ERROR,
  COMPUTED_VALUE_SET,
  COMPUTED_VALUE_UNSET,
  ComputedNode,
  destroyEffect,
} from './types.internal';
import { appendObserverToNode } from './utils';

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

    computedRefs: {},
    effectRefs: {},
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

  forEachInList(node.effectRefs, ({ node }) => node && destroyEffect(node));
  forEachInList(node.computedRefs, ({ node }) => node && destroyComputed(node));
  node.effectRefs = {};
  node.computedRefs = {};

  if (node._ref) {
    node._ref.node = undefined;
    node._ref = undefined;
  }
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
export function evaluateComputedNode(node: ComputedNode<any>): boolean {
  // return true;

  if (!node.computedRefs.head) {
    return true;
  }

  if (node.status === COMPUTED_STATUS_STABLE) {
    return true;
  }

  if (node.valueState === COMPUTED_VALUE_UNSET) {
    return true;
  }

  return recomputeValue(node);
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
