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
export type ComputedNodeRef = { node: ComputedNode<any> | undefined };

/** @internal */
export type EffectNodeRef = { node: EffectNode<any> | undefined };

/** @internal */
export type BaseSourceNode = {
  id: number;
  label?: string;
  version: number;

  computedRefs: LinkedList<ComputedNodeRef>;
  effectRefs: LinkedList<EffectNodeRef>;
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

    _ref?: ObserverRef;
    notifiedAt?: number;

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

/** @internal */
export function isComputedNode(node: ObserverNode): node is ComputedNode<any> {
  return (node as ComputedNode<any>).computation !== undefined;
}

/** @internal */
export function isEffectNode(node: ObserverNode): node is EffectNode<any> {
  return (node as EffectNode<any>).sourceAtom !== undefined;
}

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

  if (node.ref) {
    node.ref.node = undefined;
    node.ref = undefined;
  }

  node.onDestroy?.();
  node.onDestroy = undefined;
}
