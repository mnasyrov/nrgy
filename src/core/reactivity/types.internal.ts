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
export type ObserverNode = {
  id: number;
  label?: string;

  ref?: ObserverRef;
};

/** @internal */
export type ObserverRef = { node: ObserverNode | undefined };

/** @internal */
export type BaseSourceNode = {
  id: number;
  label?: string;
  version: number;

  observers: LinkedList<ObserverRef>;
};

/** @internal */
export type AtomNode<T> = BaseSourceNode & {
  equal: ValueEqualityFn<T>;
  onDestroy?: () => void;
  value: T;
  state: AtomState;
};

/** @internal */
export const COMPUTED_STATUS_OK = 0;
export const COMPUTED_STATUS_UNSET = 1;
export const COMPUTED_STATUS_COMPUTING = 2;
export const COMPUTED_STATUS_ERROR = 3;
export const COMPUTED_STATUS_STALE = 4;

/** @internal */
export type ComputedNode<T> = BaseSourceNode &
  ObserverNode & {
    version: number;

    _ref?: ObserverRef;
    observers: LinkedList<ObserverRef>;
    notifiedAt?: number;

    computation: Computation<T>;
    equal: ValueEqualityFn<T>;

    /**
     * Current value of the computation.
     *
     * This can also be one of the special values `UNSET`, `COMPUTING`, or `ERRORED`.
     */
    value: T;
    status:
      | typeof COMPUTED_STATUS_OK
      | typeof COMPUTED_STATUS_UNSET
      | typeof COMPUTED_STATUS_COMPUTING
      | typeof COMPUTED_STATUS_ERROR
      | typeof COMPUTED_STATUS_STALE;

    /**
     * If `value` is `ERRORED`, the error caught from the last computation attempt which will
     * be re-thrown.
     */
    error?: unknown;
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

/** @internal */
export function isComputedNode(node: ObserverNode): node is ComputedNode<any> {
  return (node as ComputedNode<any>).computation !== undefined;
}

/** @internal */
export function isEffectNode(node: ObserverNode): node is EffectNode<any> {
  return (node as EffectNode<any>).sourceAtom !== undefined;
}
