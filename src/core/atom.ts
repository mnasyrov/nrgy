import {
  AnyObject,
  Atom,
  ATOM_SYMBOL,
  AtomEffectNode,
  AtomNode,
  DestroyableAtom,
  ReactiveNode,
  ValueEqualityFn,
} from './common';
import { defaultEquals } from './commonUtils';
import { ENERGY_RUNTIME } from './runtime';

/**
 * Checks if the given `value` is a reactive `Atom`.
 */
export function isAtom<T>(value: unknown): value is Atom<T> {
  return (
    typeof value === 'function' &&
    ATOM_SYMBOL in value &&
    value[ATOM_SYMBOL] !== undefined
  );
}

/**
 * Returns `AtomNode` from the given Atom.
 */
export function getAtomNode<T>(value: Atom<T>): AtomNode<T> {
  return value[ATOM_SYMBOL] as AtomNode<T>;
}

/**
 * Returns a name of the given Atom.
 */
export function getAtomName(value: Atom<any>): string | undefined {
  return getAtomNode(value).name;
}

/**
 * Converts `fn` into a marked get function (where `isAtom(fn)` will be `true`).
 *
 * @param node An internal node of computation graph
 * @param fn A zero-argument function which will be converted into a `Atom`.
 */
export function createAtomFromFunction<T>(
  node: ReactiveNode,
  fn: () => T,
): Atom<T>;

/**
 * Converts `fn` into a marked get function (where `isAtom(fn)` will be `true`), and
 * potentially add some set of extra properties (passed as an object record `extraApi`).
 *
 * @param node An internal node of computation graph
 * @param fn A zero-argument function which will be converted into a `Atom`.
 * @param extraApi An object whose properties will be copied onto `fn` in order to create a specific
 *     desired interface for the `Atom`.
 */
export function createAtomFromFunction<T, U extends Record<string, unknown>>(
  node: ReactiveNode,
  fn: () => T,
  extraApi: U,
): Atom<T> & U;

/**
 * Converts `fn` into a marked get function (where `isAtom(fn)` will be `true`), and
 * potentially add some set of extra properties (passed as an object record `extraApi`).
 */
export function createAtomFromFunction<
  T,
  U extends Record<string, unknown> = AnyObject,
>(node: ReactiveNode, fn: () => T, extraApi: U = {} as U): Atom<T> & U {
  (fn as any)[ATOM_SYMBOL] = node;
  // Copy properties from `extraApi` to `fn` to complete the desired API of the `Atom`.
  return Object.assign(fn, extraApi) as Atom<T> & U;
}

/**
 * A writable `Atom` with a value that can be mutated via a setter interface.
 */
export interface WritableAtom<T> extends DestroyableAtom<T> {
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
   * unconditionally notify any dependents.
   */
  mutate(mutatorFn: (value: T) => void): void;

  /**
   * Returns a readonly version of this atom. Readonly atom can be accessed to read their value
   * but can't be changed using set, update or mutate methods.
   */
  asReadonly(): Atom<T>;

  /**
   * Destroys the atom, notifies any dependents and calls `onDestroy` callback.
   */
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

/**
 * Error thrown when an attempt is made to update an atom in a tracked context.
 */
export class AtomUpdateError extends Error {
  constructor(name?: string) {
    super(
      'Atom cannot be updated in tracked context' + (name ? ` (${name})` : ''),
    );
    this.name = 'AtomUpdateError';
  }
}

class WritableAtomImpl<T> implements AtomNode<T> {
  readonly name?: string;

  private readonlyAtom: Atom<T> | undefined;
  private readonly equal: ValueEqualityFn<T>;
  private readonly consumerEffects = new Map<WeakRef<AtomEffectNode>, number>();
  private onDestroy?: () => void;

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

    this.producerBeforeChange();

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
    this.onDestroy?.();
    this.onDestroy = undefined;

    this.isDestroyed = true;
  }

  /**
   * Checks if the atom can be updated in the current context
   */
  protected producerBeforeChange(): void {
    if (ENERGY_RUNTIME.tracked) {
      throw new AtomUpdateError(this.name);
    }
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
   * Notify all consumers of this producer that it is destroyed
   */
  protected producerDestroyed(): void {
    for (const [effectRef] of this.consumerEffects) {
      const effect = effectRef.deref();

      if (effect && !effect.isDestroyed) {
        effect.notifyDestroy();
      }
    }
  }

  /**
   * Mark that this producer node has been accessed in the current reactive context.
   */
  protected producerAccessed(): void {
    if (!ENERGY_RUNTIME.tracked) {
      return;
    }

    const effects = ENERGY_RUNTIME.getTrackedEffects();

    if (effects.length > 0) {
      for (const effect of effects) {
        if (!effect.isDestroyed) {
          this.consumerEffects.set(effect.ref, effect.clock);
        }
      }
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
