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
  ConsumerNode,
} from './types.internal';

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export const atom: AtomFn = function <T>(
  initialValue: T,
  options?: AtomOptions<T>,
): WritableAtom<T> {
  const node: AtomNode<T> = {
    name: options?.name,
    version: 0,
    equal: options?.equal ?? defaultEquals,
    onDestroy: options?.onDestroy,
    consumers: new LinkedList<DataRef<ConsumerNode>>(),
    value: initialValue,
    state: ATOM_STATE_ALIVE,
  };

  const getter = () => getAtomValue(node);
  getter[ATOM_SYMBOL] = node;
  getter.destroy = () => destroy(node);
  getter.set = (value: T) => set(node, value);
  getter.update = (updater: (value: T) => T) => set(node, updater(node.value));
  getter.mutate = (mutator: (value: T) => void) =>
    set(node, undefined, mutator);

  return getter;
};

function getAtomValue<T>(node: AtomNode<T>): T {
  // Mark that this producer node has been accessed in the current reactive context.
  // RUNTIME.trackAtom(this);
  if (node.state === ATOM_STATE_ALIVE && RUNTIME.activeConsumer) {
    node.consumers.add(RUNTIME.activeConsumer.getRef());
  }

  return node.value;
}

function set<T>(
  node: AtomNode<T>,
  newValue: T | undefined,
  mutator?: (value: T) => void,
): void {
  if (node.state === ATOM_STATE_DESTROYED) {
    return;
  }

  if (RUNTIME.isTracked()) {
    throw new AtomUpdateError(node.name);
  }

  let isChanged;
  if (mutator) {
    // Mutation bypasses equality checks
    mutator(node.value);
    isChanged = true;
  } else {
    isChanged = !node.equal(node.value, newValue!);
    if (isChanged) {
      node.value = newValue!;
    }
  }

  if (isChanged) {
    node.version = nextSafeInteger(node.version);
    RUNTIME.updateAtomClock();

    // RUNTIME.syncScheduler.schedule(() => notifyAtom(node));
    notifyAtom(node);
  }
}

// Notify all consumers of this producer that its value is changed
function notifyAtom(node: AtomNode<any>): void {
  if (node.state === ATOM_STATE_ALIVE && !node.consumers.isEmpty()) {
    const consumerRefs = node.consumers.head;
    node.consumers.clear();

    let item = consumerRefs;
    while (item) {
      item.value.value?.notify();
      item = item.next;
    }
  }
}

function destroy<T>(node: AtomNode<T>): void {
  if (node.state !== ATOM_STATE_ALIVE) {
    return;
  }

  node.state = ATOM_STATE_PREDESTROY;

  node.consumers.forEach((consumerRef) => consumerRef.value?.destroy());
  node.consumers.clear();

  node.onDestroy?.();

  node.state = ATOM_STATE_DESTROYED;
}
