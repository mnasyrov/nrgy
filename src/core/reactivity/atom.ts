import { defaultEquals } from '../common/defaultEquals';
import { DataRef } from '../common/utilityTypes';
import { LinkedList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';

import { AtomUpdateError } from './atomUpdateError';
import { RUNTIME } from './runtime';
import { ATOM_SYMBOL } from './symbols';
import {
  AtomFn,
  AtomNode,
  AtomOptions,
  ConsumerNode,
  ValueEqualityFn,
  WritableAtom,
} from './types';

const ATOM_STATE_ALIVE = 0;
const ATOM_STATE_PREDESTROY = 1;
const ATOM_STATE_DESTROYED = 2;

type AtomState =
  | typeof ATOM_STATE_ALIVE
  | typeof ATOM_STATE_PREDESTROY
  | typeof ATOM_STATE_DESTROYED;

type Node<T> = AtomNode & {
  name?: string;
  version: number;
  equal: ValueEqualityFn<T>;
  onDestroy?: () => void;
  consumers: LinkedList<DataRef<ConsumerNode>>;
  value: T;
  state: AtomState;
};

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export const atom: AtomFn = function <T>(
  initialValue: T,
  options?: AtomOptions<T>,
): WritableAtom<T> {
  const node: Node<T> = {
    name: options?.name,
    version: 0,
    equal: options?.equal ?? defaultEquals,
    onDestroy: options?.onDestroy,
    consumers: new LinkedList<DataRef<ConsumerNode>>(),
    value: initialValue,
    state: ATOM_STATE_ALIVE,
  };

  const getter = () => get(node);
  getter[ATOM_SYMBOL] = node;
  getter.destroy = () => destroy(node);
  getter.set = (value: T) => set(node, value);
  getter.update = (updater: (value: T) => T) => set(node, updater(node.value));
  getter.mutate = (mutator: (value: T) => void) =>
    set(node, undefined, mutator);

  return getter;
};

function get<T>(node: Node<T>): T {
  // Mark that this producer node has been accessed in the current reactive context.
  // RUNTIME.trackAtom(this);
  if (node.state === ATOM_STATE_ALIVE && RUNTIME.activeEffect) {
    node.consumers.add(RUNTIME.activeEffect.getRef());
  }

  return node.value;
}

function set<T>(
  node: Node<T>,
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
    // Notify all consumers of this producer that its value is changed

    RUNTIME.updateAtomClock();
    node.version = nextSafeInteger(node.version);

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
}

function destroy<T>(node: Node<T>): void {
  if (node.state !== ATOM_STATE_ALIVE) {
    return;
  }

  node.state = ATOM_STATE_PREDESTROY;

  node.consumers.forEach((consumerRef) => consumerRef.value?.destroy());
  node.consumers.clear();

  node.onDestroy?.();

  node.state = ATOM_STATE_DESTROYED;
}
