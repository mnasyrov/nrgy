import {
  Atom,
  AtomEffectNode,
  createAtomFromFunction,
  defaultEquals,
  ReactiveNode,
  ValueEqualityFn,
} from './common';
import { ENERGY_RUNTIME } from './runtime';

/**
 * A `Atom` with a value that can be mutated via a setter interface.
 */
export interface WritableAtom<T> extends Atom<T> {
  /**
   * Directly set the atom to a new value, and notify any dependents.
   */
  set(value: T): void;

  /**
   * Update the value of the atom based on its current value, and
   * notify any dependents.
   */
  update(updateFn: (value: T) => T): void;

  /**
   * Update the current value by mutating it in-place, and
   * notify any dependents.
   */
  mutate(mutatorFn: (value: T) => void): void;

  /**
   * Returns a readonly version of this atom. Readonly atom can be accessed to read their value
   * but can't be changed using set, update or mutate methods.
   */
  asReadonly(): Atom<T>;

  destroy(): void;
}

/**
 * Options passed to the `atom` creation function.
 */
export type AtomOptions<T> = {
  /**
   * Atom's name
   */
  name?: string;

  /**
   * A comparison function which defines equality for atom values.
   */
  equal?: ValueEqualityFn<T>;

  /**
   * Callback is called when the store is destroyed.
   */
  onDestroy?: () => void;
};

class WritableAtomImpl<T> implements ReactiveNode {
  private readonlyAtom: Atom<T> | undefined;

  private readonly name?: string;
  private readonly equal: ValueEqualityFn<T>;
  private onDestroy?: () => void;
  private readonly consumerEffects = new Map<WeakRef<AtomEffectNode>, number>();

  private isDestroyed = false;

  constructor(
    private value: T,
    options?: AtomOptions<T>,
  ) {
    this.name = options?.name;
    this.equal = options?.equal ?? defaultEquals;
    this.onDestroy = options?.onDestroy;
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
   */
  set(newValue: T): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.equal(this.value, newValue)) {
      return;
    }

    this.value = newValue;

    this.producerChanged();
  }

  /**
   * Derive a new value for the atom from its current value using the `updater` function.
   *
   * This is equivalent to calling `set` on the result of running `updater` on the current
   * value.
   */
  update(updater: (value: T) => T): void {
    this.set(updater(this.value));
  }

  /**
   * Calls `mutator` on the current value and assumes that it has been mutated.
   */
  mutate(mutator: (value: T) => void): void {
    if (this.isDestroyed) {
      return;
    }

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

    this.consumerEffects.clear();
    this.isDestroyed = true;
    this.onDestroy?.();
    this.onDestroy = undefined;
  }

  /**
   * Notify all consumers of this producer that its value is changed.
   */
  protected producerChanged(): void {
    ENERGY_RUNTIME.updateAtomClock();

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
   * Mark that this producer node has been accessed in the current reactive context.
   */
  protected producerAccessed(): void {
    const effects = ENERGY_RUNTIME.getTrackedEffects();

    if (effects.length > 0) {
      effects.forEach((effect) => {
        if (!effect.isDestroyed) {
          this.consumerEffects.set(effect.ref, effect.clock);
        }
      });
    }
  }
}

/**
 * Create a `Atom` that can be set or updated directly.
 */
export function atom<T>(
  initialValue: T,
  options?: AtomOptions<T>,
): WritableAtom<T> {
  const node = new WritableAtomImpl<T>(initialValue, options);

  const result: WritableAtom<T> = createAtomFromFunction(
    node,
    node.get.bind(node),
    {
      set: node.set.bind(node),
      update: node.update.bind(node),
      mutate: node.mutate.bind(node),
      asReadonly: node.asReadonly.bind(node),

      destroy: node.destroy.bind(node),
    },
  );

  return result;
}
