import { defaultEquals } from '../common/defaultEquals';
import { DataRef } from '../common/utilityTypes';
import { LinkedList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import {
  Atom,
  AtomNode,
  Computation,
  ComputeFn,
  ComputeOptions,
  ConsumerNode,
  ValueEqualityFn,
} from './types';

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

type ComputedData<T> = {
  name?: string;
  version: number;
  computation: Computation<T>;
  _ref?: DataRef<ConsumerNode>;
  clock?: number;
  equal: ValueEqualityFn<T>;

  /**
   * Current value of the computation.
   *
   * This can also be one of the special values `UNSET`, `COMPUTING`, or `ERRORED`.
   */
  value: T;

  /**
   * If `value` is `ERRORED`, the error caught from the last computation attempt which will
   * be re-thrown.
   */
  error?: unknown;

  consumers: LinkedList<DataRef<ConsumerNode>>;
  notifiedAt?: number;
};

/**
 * A computation, which derives a value from a declarative reactive expression.
 */
type ComputedNodeImpl<T> = AtomNode &
  ComputedData<T> & {
    destroy: () => void;
    getRef: () => DataRef<ConsumerNode>;
    notify: () => void;
    get: () => T;
  };

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
  const data: ComputedData<T> = {
    computation: computation,
    name: options?.name,
    equal: options?.equal ?? defaultEquals,

    version: 0,
    value: UNSET,
    consumers: new LinkedList<DataRef<ConsumerNode>>(),
  };

  const node = data as ComputedNodeImpl<T>;
  node.destroy = (destroy<T>).bind(node);
  node.get = (get<T>).bind(node);
  node.getRef = (getRef<T>).bind(node);
  node.notify = (notify<T>).bind(node);

  const getter = node.get as any;
  getter[ATOM_SYMBOL] = node;
  getter.destroy = node.destroy;

  return getter;
};

function destroy<T>(this: ComputedNodeImpl<T>): void {
  this.value = UNSET;
  this.notifiedAt = undefined;

  this.consumers.forEach((ref) => ref.value?.destroy());
  this.consumers.clear();

  if (this._ref) {
    this._ref.value = undefined;
    this._ref = undefined;
  }
}

function getRef<T>(this: ComputedNodeImpl<T>): DataRef<ConsumerNode> {
  if (!this._ref) {
    this._ref = { value: this };
  }
  return this._ref;
}

function notify<T>(this: ComputedNodeImpl<T>): void {
  if (this.notifiedAt === RUNTIME.clock) {
    return;
  }
  this.notifiedAt = RUNTIME.clock;

  const consumerRefs = this.consumers.head;
  this.consumers.clear();

  let item = consumerRefs;
  while (item) {
    item.value.value?.notify();
    item = item.next;
  }
}

function get<T>(this: ComputedNodeImpl<T>): T {
  const trackingMode: boolean = !!RUNTIME.activeEffect;

  if (this.value === COMPUTING) {
    // Our computation somehow led to a cyclic read of itself.
    throw new Error('Detected cycle in computations');
  }

  const isStale = this.clock !== RUNTIME.clock || this.value === UNSET;
  const mustRenewSource = RUNTIME.activeEffect && this.consumers.isEmpty();

  if (RUNTIME.activeEffect) {
    this.consumers.add(RUNTIME.activeEffect.getRef());
  }

  if (isStale || mustRenewSource) {
    (recomputeValue<T>).call(this, trackingMode);
  }

  if (this.value === ERRORED) {
    throw this.error;
  }

  return this.value;
}

function recomputeValue<T>(
  this: ComputedNodeImpl<T>,
  trackingMode: boolean,
): void {
  const oldValue = this.value;
  this.value = COMPUTING;

  let newValue: T;

  try {
    newValue = trackingMode
      ? RUNTIME.runAsTracked(this, this.computation)
      : this.computation();
  } catch (err) {
    newValue = ERRORED;
    this.error = err;
  }

  // As we're re-running the computation, update our dependent tracking version number.
  this.clock = RUNTIME.clock;

  if (
    oldValue === UNSET ||
    oldValue === ERRORED ||
    newValue === ERRORED ||
    !this.equal(oldValue, newValue)
  ) {
    this.value = newValue;
    this.version = nextSafeInteger(this.version);
  } else {
    // No change to `valueVersion` - old and new values are
    // semantically equivalent.
    this.value = oldValue;
  }
}
