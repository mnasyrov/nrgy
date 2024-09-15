import { defaultEquals } from '../common/defaultEquals';
import { AtomConsumer, WritableAtomNode } from '../common/reactiveNodes';
import { Atom, ValueEqualityFn } from '../common/types';
import { DataRef } from '../common/utilityTypes';
import { syncEffect } from '../effects/effect';
import { LinkedList } from '../internals/list';
import { nextSafeInteger } from '../internals/nextSafeInteger';
import { RUNTIME } from '../internals/runtime';
import { destroySignal } from '../signals/common';
import { signal } from '../signals/signal';

import {
  AtomOptions,
  AtomUpdateError,
  createAtomFromFunction,
  generateAtomId,
  WritableAtom,
} from './atom';
import { AtomFn } from './types';

const ATOM_STATE_ALIVE = 0;
const ATOM_STATE_PREDESTROY = 1;
const ATOM_STATE_DESTROYED = 2;

type AtomState =
  | typeof ATOM_STATE_ALIVE
  | typeof ATOM_STATE_PREDESTROY
  | typeof ATOM_STATE_DESTROYED;

class WritableAtomImpl<T> implements WritableAtomNode<T> {
  readonly id: number = generateAtomId();
  readonly name?: string;

  version = 0;

  /**
   * Signals that the effect has been destroyed
   */
  readonly onDestroyed = signal<void>({ sync: true });

  private readonlyAtom: Atom<T> | undefined;
  private readonly equal: ValueEqualityFn<T>;

  private consumers = new LinkedList<DataRef<AtomConsumer>>();

  private state: AtomState = ATOM_STATE_ALIVE;

  constructor(
    private value: T,
    options?: AtomOptions<T>,
  ) {
    this.name = options?.name;
    this.equal = options?.equal ?? defaultEquals;

    if (options?.onDestroy) {
      syncEffect(this.onDestroyed, options.onDestroy);
    }
  }

  get(): T {
    // Mark that this producer node has been accessed in the current reactive context.
    // RUNTIME.trackAtom(this);
    if (this.state === ATOM_STATE_ALIVE && RUNTIME.activeEffect) {
      this.consumers.add(RUNTIME.activeEffect.ref);
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
  set(newValue: T): boolean {
    if (this.state === ATOM_STATE_DESTROYED) {
      return false;
    }

    this.producerBeforeChange();

    if (this.equal(this.value, newValue)) {
      return false;
    }

    this.value = newValue;

    this.producerChanged();

    return true;
  }

  /**
   * Derive a new value for the atom from its current value using the `updater` function.
   *
   * This is equivalent to calling `set` on the result of running `updater` on the current
   * value.
   *
   * Returns `true` if the value was changed.
   */
  update(updater: (value: T) => T): boolean {
    return this.set(updater(this.value));
  }

  /**
   * Calls `mutator` on the current value and assumes that it has been mutated.
   */
  mutate(mutator: (value: T) => void): void {
    if (this.state === ATOM_STATE_DESTROYED) {
      return;
    }

    this.producerBeforeChange();

    // Mutate bypasses equality checks as it's by definition changing the value.
    mutator(this.value);

    this.producerChanged();
  }

  asReadonly(): Atom<T> {
    if (this.readonlyAtom === undefined) {
      this.readonlyAtom = createAtomFromFunction(this, () => this.get());
    }
    return this.readonlyAtom;
  }

  destroy() {
    if (this.state !== ATOM_STATE_ALIVE) {
      return;
    }

    this.state = ATOM_STATE_PREDESTROY;

    this.consumers.forEach((consumerRef) => consumerRef.value?.destroy());
    this.consumers.clear();

    this.onDestroyed();
    destroySignal(this.onDestroyed);

    this.state = ATOM_STATE_DESTROYED;
  }

  /**
   * Checks if the atom can be updated in the current context
   */
  protected producerBeforeChange(): void {
    if (RUNTIME.tracked) {
      throw new AtomUpdateError(this.name);
    }
  }

  /**
   * Notify all consumers of this producer that its value is changed.
   */
  protected producerChanged(): void {
    RUNTIME.updateAtomClock();
    this.version = nextSafeInteger(this.version);

    if (this.state === ATOM_STATE_ALIVE && !this.consumers.isEmpty()) {
      const consumerRefs = this.consumers.clonePointers();
      this.consumers.clear();

      RUNTIME.syncScheduler.schedule(() => {
        consumerRefs.forEach(({ value: consumer }) => consumer?.notify());
      });
    }
  }
}

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export const atom: AtomFn = <T>(
  initialValue: T,
  options?: AtomOptions<T>,
): WritableAtom<T> => {
  const node = new WritableAtomImpl<T>(initialValue, options);

  const result: WritableAtom<T> = createAtomFromFunction(
    node,
    node.get.bind(node),
    {
      onDestroyed: node.onDestroyed,

      set: node.set.bind(node),
      update: node.update.bind(node),
      mutate: node.mutate.bind(node),
      asReadonly: node.asReadonly.bind(node),

      destroy: node.destroy.bind(node),
    },
  );

  return result;
};
