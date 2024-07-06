import {
  AtomOptions,
  AtomUpdateError,
  createAtomFromFunction,
  generateAtomId,
  WritableAtom,
} from '../atom';
import { Atom, AtomEffectNode, AtomNode, ValueEqualityFn } from '../common';
import { defaultEquals } from '../commonUtils';
import { syncEffect } from '../effect';
import { RUNTIME } from '../runtime';
import { destroySignal, signal } from '../signals/signal';
import { nextSafeInteger } from '../utils/nextSafeInteger';

import { AtomFn } from './types';

class WritableAtomImpl<T> implements AtomNode<T> {
  readonly id: number = generateAtomId();
  readonly name?: string;

  version = 0;

  /**
   * Signals that the effect has been destroyed
   */
  readonly onDestroyed = signal<void>({ sync: true });

  private readonlyAtom: Atom<T> | undefined;
  private readonly equal: ValueEqualityFn<T>;
  private readonly consumerEffects = new Map<WeakRef<AtomEffectNode>, number>();

  private isDestroyed = false;

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
    if (!this.isDestroyed) {
      this.producerAccessed();
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
    if (this.isDestroyed) {
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
    if (this.isDestroyed) {
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
    if (this.isDestroyed) {
      return;
    }

    this.producerDestroyed();
    this.consumerEffects.clear();

    this.onDestroyed();
    destroySignal(this.onDestroyed);

    this.isDestroyed = true;
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

    for (const [effectRef, atEffectClock] of this.consumerEffects) {
      const effect = effectRef.deref();

      if (
        !effect ||
        effect.isDestroyed ||
        (!effect.dirty && effect.clock !== atEffectClock)
      ) {
        this.consumerEffects.delete(effectRef);
        continue;
      }

      effect.notify();
    }
  }

  /**
   * Notify all consumers of this producer that it is destroyed
   */
  protected producerDestroyed(): void {
    for (const [effectRef] of this.consumerEffects) {
      const effect = effectRef.deref();

      if (effect && !effect.isDestroyed) {
        effect.notifyDestroy(this.id);
      }
    }
  }

  /**
   * Mark that this producer node has been accessed in the current reactive context.
   */
  protected producerAccessed(): void {
    if (!RUNTIME.tracked) {
      return;
    }

    const effect = RUNTIME.currentEffect;
    if (effect && !effect.isDestroyed) {
      this.consumerEffects.set(effect.ref, effect.clock);
      effect.notifyAccess(this.id);
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
