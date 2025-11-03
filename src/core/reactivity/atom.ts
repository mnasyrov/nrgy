import { defaultEquals } from '../common/defaultEquals';
import { DataRef } from '../common/utilityTypes';
import { LinkedList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { AtomUpdateError } from './atomUpdateError';
import { RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import { AtomFn, AtomOptions, WritableAtom } from './types';
import {
  ATOM_STATE_ALIVE,
  ATOM_STATE_DESTROYED,
  ATOM_STATE_PREDESTROY,
  AtomNode,
  ObserverNode,
} from './types.internal';
import { getSourceAtomNodeLabel } from './utils';

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export const atom: AtomFn = function <T>(
  initialValue: T,
  options?: AtomOptions<T>,
): WritableAtom<T> {
  const node: AtomNode<T> = {
    id: RUNTIME.nextId++,
    label: options?.label,

    version: 0,
    equal: options?.equal ?? defaultEquals,
    onDestroy: options?.onDestroy,
    consumers: new LinkedList<DataRef<ObserverNode>>(),
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
    node.consumers.add(RUNTIME.activeObserver.getRef());
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

// Notify all consumers of this producer that its value is changed
function notifyAtomDepsAboutChange(node: AtomNode<any>): void {
  if (node.state === ATOM_STATE_ALIVE && !node.consumers.isEmpty()) {
    const consumerRefs = node.consumers.head;
    node.consumers.clear();

    let item = consumerRefs;
    while (item) {
      item.value.value?.onSourceUpdated();
      item = item.next;
    }
  }
}

function destroyAtom<T>(node: AtomNode<T>): void {
  if (node.state !== ATOM_STATE_ALIVE) {
    return;
  }

  node.state = ATOM_STATE_PREDESTROY;

  node.consumers.forEach((consumerRef) => consumerRef.value?.onSourceDestroy());
  node.consumers.clear();

  node.onDestroy?.();

  node.state = ATOM_STATE_DESTROYED;
}
