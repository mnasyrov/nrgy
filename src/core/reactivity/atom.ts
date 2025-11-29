import { defaultEquals } from '../common/defaultEquals';
import {
  appendListToEnd,
  appendListToHead,
  appendToList,
  LinkedList,
  popListHead,
} from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { AtomUpdateError } from './atomUpdateError';
import { destroyComputed, notifyComputed } from './compute';
import { destroyEffect, notifyEffect } from './effect';
import { getObserverRef, RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import { AtomFn, AtomOptions, SourceAtom } from './types';
import {
  ATOM_STATE_ALIVE,
  ATOM_STATE_DESTROYED,
  ATOM_STATE_PREDESTROY,
  AtomNode,
  EffectNode,
  isComputedNode,
  isEffectNode,
  ObserverRef,
} from './types.internal';
import { getSourceAtomNodeLabel } from './utils';

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
    observers: {},
    value: initialValue,
    state: ATOM_STATE_ALIVE,
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
    appendToList(node.observers, getObserverRef(RUNTIME.activeObserver));
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
    notifyAtomDepsAboutChange(node);
  }
}

// Notify all observers of this producer that its value is changed
function notifyAtomDepsAboutChange(sourceNode: AtomNode<any>): void {
  if (sourceNode.state !== ATOM_STATE_ALIVE || !sourceNode.observers.head) {
    return;
  }

  const effectQueue: LinkedList<EffectNode<any>> = {};
  const observerQueue = sourceNode.observers;
  sourceNode.observers = {};

  let observerRef: ObserverRef | undefined;
  while ((observerRef = popListHead(observerQueue))) {
    const node = observerRef?.node;
    if (!node) continue;

    if (isComputedNode(node)) {
      const nextObservers = notifyComputed(node);
      if (nextObservers) {
        appendListToHead(observerQueue, nextObservers);
      }
    } else if (isEffectNode(node)) {
      appendToList(effectQueue, node);
    }
  }

  let effectNode: EffectNode<any> | undefined;
  while ((effectNode = popListHead(effectQueue))) {
    notifyEffect(effectNode);
  }
}

/** @internal */
function destroyAtom<T>(sourceNode: AtomNode<T>): void {
  if (sourceNode.state !== ATOM_STATE_ALIVE) {
    return;
  }
  sourceNode.state = ATOM_STATE_PREDESTROY;

  const observerQueue = sourceNode.observers;
  sourceNode.observers = {};

  let observerRef: ObserverRef | undefined;
  while ((observerRef = popListHead(observerQueue))) {
    const node = observerRef?.node;
    if (!node) continue;

    if (isComputedNode(node)) {
      appendListToEnd(observerQueue, node.observers);
      destroyComputed(node);
    } else if (isEffectNode(node)) {
      destroyEffect(node);
    }
  }

  sourceNode.onDestroy?.();
  sourceNode.state = ATOM_STATE_DESTROYED;
}
