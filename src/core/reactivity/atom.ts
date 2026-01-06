import { defaultEquals } from '../common/defaultEquals';
import {
  appendListToEnd,
  forEachInList,
  LinkedList,
  popListHead,
} from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { AtomUpdateError } from './atomUpdateError';
import { destroyComputed, evaluateComputedNode } from './compute';
import { notifyEffect } from './effect';
import { RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import { AtomFn, AtomOptions, SourceAtom } from './types';
import {
  ATOM_STATE_ALIVE,
  ATOM_STATE_DESTROYED,
  ATOM_STATE_PREDESTROY,
  AtomNode,
  COMPUTED_STATUS_STALE,
  ComputedNodeRef,
  destroyEffect,
  EffectNodeRef,
} from './types.internal';
import {
  appendObserverToNode,
  getSourceAtomNodeLabel,
  hasNoObservers,
} from './utils';

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

    computedRefs: {},
    effectRefs: {},
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
  RUNTIME.updateAtomClock();

  if (node.state === ATOM_STATE_ALIVE) {
    // RUNTIME.syncScheduler.schedule(() => notifyAtomDepsAboutChange(node));
    propagateAtomChanges(node);
  }
}

function markComputedNodesAsStale(computedRefs: LinkedList<ComputedNodeRef>) {
  forEachInList(computedRefs, ({ node }) => {
    if (node) node.status = COMPUTED_STATUS_STALE;
  });
}

// Notify all observers of this producer that its value is changed
function propagateAtomChanges(sourceNode: AtomNode<any>): void {
  if (sourceNode.state !== ATOM_STATE_ALIVE || hasNoObservers(sourceNode)) {
    return;
  }

  const computedRefsQueue: LinkedList<ComputedNodeRef> = {};
  const effectRefQueue: LinkedList<EffectNodeRef> = {};

  markComputedNodesAsStale(sourceNode.computedRefs);
  appendListToEnd(computedRefsQueue, sourceNode.computedRefs);
  appendListToEnd(effectRefQueue, sourceNode.effectRefs);
  sourceNode.computedRefs = {};
  sourceNode.effectRefs = {};

  let computedRef: ComputedNodeRef | undefined;
  while ((computedRef = popListHead(computedRefsQueue))) {
    const computedNode = computedRef?.node;
    if (!computedNode) continue;

    if (evaluateComputedNode(computedNode)) {
      markComputedNodesAsStale(computedNode.computedRefs);
      appendListToEnd(computedRefsQueue, computedNode.computedRefs);
      appendListToEnd(effectRefQueue, computedNode.effectRefs);
      computedNode.computedRefs = {};
      computedNode.effectRefs = {};
    }
  }

  let effectNodeRef: EffectNodeRef | undefined;
  while ((effectNodeRef = popListHead(effectRefQueue))) {
    const effectNode = effectNodeRef?.node;
    if (effectNode) notifyEffect(effectNode);
  }
}

/** @internal */
function destroyAtom<T>(sourceNode: AtomNode<T>): void {
  if (sourceNode.state !== ATOM_STATE_ALIVE) {
    return;
  }
  sourceNode.state = ATOM_STATE_PREDESTROY;

  forEachInList(
    sourceNode.effectRefs,
    ({ node }) => node && destroyEffect(node),
  );
  forEachInList(
    sourceNode.computedRefs,
    ({ node }) => node && destroyComputed(node),
  );
  sourceNode.effectRefs = {};
  sourceNode.computedRefs = {};

  sourceNode.onDestroy?.();
  sourceNode.state = ATOM_STATE_DESTROYED;
}
