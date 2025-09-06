import { DataRef } from '../common/utilityTypes';
import { LinkedList } from '../internals/list';

import { TaskScheduler } from './schedulers';
import { Atom, Computation, EffectCallback, ValueEqualityFn } from './types';

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
export type AtomNode<T> = {
  /** The name of the atom */
  name?: string;

  /** The version of the cached value*/
  version: number;

  equal: ValueEqualityFn<T>;
  onDestroy?: () => void;
  consumers: LinkedList<DataRef<ConsumerNode>>;
  value: T;
  state: AtomState;
};

/** @internal */
export type ConsumerNode = {
  /** Destroys the node */
  destroy: () => void;

  /**
   * The reference to this effect node
   */
  getRef: () => DataRef<ConsumerNode>;

  /**
   * Schedule the effect to be re-run
   */
  notify: () => void;
};

/** @internal */
export type ComputedNode<T> = ConsumerNode & {
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

  get: () => T;
};

/** @internal */
export type EffectNode<T> = ConsumerNode & {
  ref?: DataRef<ConsumerNode>;
  lastValueVersion?: number;
  dirty: boolean;
  isDestroyed: boolean;

  scheduler?: TaskScheduler;
  source?: Atom<T>;
  action?: EffectCallback<T>;

  onError?: (error: unknown) => void;
  onDestroy?: () => void;
};
