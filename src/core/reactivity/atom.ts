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

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export const atom: AtomFn = function <T>(
  initialValue: T,
  options?: AtomOptions<T>,
): WritableAtom<T> {
  const node = new WritableAtomImpl<T>(initialValue, options);

  const getter = node.get.bind(node) as any;
  getter[ATOM_SYMBOL] = node;
  getter.destroy = node.destroy.bind(node);
  getter.set = node.set.bind(node);
  getter.update = (updateWritableAtom<T>).bind(node);
  getter.mutate = (mutate<T>).bind(node);

  return getter;
};

const ATOM_STATE_ALIVE = 0;
const ATOM_STATE_PREDESTROY = 1;
const ATOM_STATE_DESTROYED = 2;

type AtomState =
  | typeof ATOM_STATE_ALIVE
  | typeof ATOM_STATE_PREDESTROY
  | typeof ATOM_STATE_DESTROYED;

class WritableAtomImpl<T> implements AtomNode {
  readonly name?: string;

  version = 0;

  protected value: T;
  private readonly equal: ValueEqualityFn<T>;
  private onDestroy?: () => void;

  private consumers = new LinkedList<DataRef<ConsumerNode>>();

  private state: AtomState = ATOM_STATE_ALIVE;

  constructor(value: T, options?: AtomOptions<T>) {
    this.value = value;
    this.name = options?.name;
    this.equal = options?.equal ?? defaultEquals;
    this.onDestroy = options?.onDestroy;
  }

  get(): T {
    // Mark that this producer node has been accessed in the current reactive context.
    // RUNTIME.trackAtom(this);
    if (this.state === ATOM_STATE_ALIVE && RUNTIME.activeEffect) {
      this.consumers.add(RUNTIME.activeEffect.getRef());
    }

    return this.value;
  }

  /**
   * Directly update the value of the atom to a new value, which may or may not be
   * equal to the previous.
   *
   * In the event that `newValue` is semantically equal to the current value, `set` is
   * a no-op.
   *
   * Returns `true` if the value was changed.
   */
  set(newValue: T, mutator?: undefined): void;

  /**
   * Calls `mutator` on the current value and assumes that it has been mutated.
   */
  set(newValue: undefined, mutator: (value: T) => void): void;

  set(newValue: T | undefined, mutator?: (value: T) => void): void {
    if (this.state === ATOM_STATE_DESTROYED) {
      return;
    }

    if (RUNTIME.tracked) {
      throw new AtomUpdateError(this.name);
    }

    let isChanged;
    if (mutator) {
      // Mutation bypasses equality checks
      mutator(this.value);
      isChanged = true;
    } else {
      isChanged = !this.equal(this.value, newValue!);
      if (isChanged) {
        this.value = newValue!;
      }
    }

    if (isChanged) {
      // Notify all consumers of this producer that its value is changed

      RUNTIME.updateAtomClock();
      this.version = nextSafeInteger(this.version);

      if (this.state === ATOM_STATE_ALIVE && !this.consumers.isEmpty()) {
        const consumerRefs = this.consumers.head;
        this.consumers.clear();

        let item = consumerRefs;
        while (item) {
          item.value.value?.notify();
          item = item.next;
        }
      }
    }
  }

  destroy() {
    if (this.state !== ATOM_STATE_ALIVE) {
      return;
    }

    this.state = ATOM_STATE_PREDESTROY;

    this.consumers.forEach((consumerRef) => consumerRef.value?.destroy());
    this.consumers.clear();

    this.onDestroy?.();

    this.state = ATOM_STATE_DESTROYED;
  }
}

/**
 * Derive a new value for the atom from its current value using the `updater` function.
 *
 * This is equivalent to calling `set` on the result of running `updater` on the current
 * value.
 *
 * Returns `true` if the value was changed.
 */
function updateWritableAtom<T>(
  this: WritableAtomImpl<T>,
  updater: (value: T) => T,
): void {
  const nextValue = updater(this.value);
  this.set(nextValue);
}

/**
 * Calls `mutator` on the current value and assumes that it has been mutated.
 */
function mutate<T>(
  this: WritableAtomImpl<T>,
  mutator: (value: T) => void,
): void {
  this.set(undefined, mutator);
}
