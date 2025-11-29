// istanbul ignore next
import { ATOM_SYMBOL } from './symbols';

/**
 * A reactive value which notifies observers for any changes.
 *
 * Atoms are functions that return their current value. To access the current value of an atom,
 * call it.
 */
export type Atom<T> = (() => T) & {
  /** @internal */
  readonly [ATOM_SYMBOL]: unknown;
};

/**
 * An Atom that can be destroyed
 */
export type DestroyableAtom<T> = Atom<T> &
  Readonly<{
    /**
     * Destroys the atom, notifies any dependents and calls `onDestroy` callback.
     */
    destroy(): void;
  }>;

/**
 * A comparison function which can determine if two values are equal.
 */
export type ValueEqualityFn<T> = (a: T, b: T) => boolean;

/**
 * Type for an array of atoms
 */
export type AtomList<TValues extends unknown[]> = [
  ...{ [K in keyof TValues]: Atom<TValues[K]> },
];

/**
 * A source `Atom` with a value that can be mutated via a setter interface.
 */
export interface SourceAtom<T> extends Atom<T> {
  /**
   * Directly set the atom to a new value and notify any dependents.
   */
  set(value: T): void;

  /**
   * Update the value of the atom based on its current value and
   * notify any dependents.
   */
  update(updateFn: (value: T) => T): void;

  /**
   * Update the current value by mutating it in-place, and
   * unconditionally notify any dependents.
   */
  mutate(mutatorFn: (value: T) => void): void;

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
  label?: string;

  /**
   * A comparison function which defines equality for atom values.
   */
  equal?: ValueEqualityFn<T>;

  /**
   * Callback is called when the atom is destroyed.
   */
  onDestroy?: () => void;
};

/**
 * Factory to create a writable `Atom` that can be set or updated directly.
 */
export interface AtomFn {
  <T>(initialValue: T, options?: AtomOptions<T>): SourceAtom<T>;
}

/**
 * A pure function that returns a value.
 */
export type Computation<T> = () => T;

/**
 * Options for `compute`
 */
export type ComputeOptions<T> = {
  /**
   * Atom's name
   */
  label?: string;

  /**
   * A comparison function which defines equality for atom values.
   */
  equal?: ValueEqualityFn<T>;
};

/**
 * Create a computed `Atom` which derives a reactive value from an expression.
 *
 * @param computation A pure function that returns a value
 * @param options ComputeOptions
 */
export interface ComputeFn {
  <T>(computation: Computation<T>, options?: ComputeOptions<T>): Atom<T>;
}

/**
 * A reactive effect, which can be manually destroyed.
 */
export type EffectSubscription = Readonly<{
  /**
   * Unsubscribes and destroys the effect
   */
  destroy(): void;
}>;

export type EffectCallback<T> = (value: T) => unknown;

/**
 * Options for an effect
 */
export type EffectOptions = {
  label?: string;
  sync?: boolean;

  /**
   * Callback is called when the action trows an error
   */
  onError?: (error: unknown) => void;

  /**
   * Callback is called when the effect has been destroyed
   */
  onDestroy?: () => void;

  waitChanges?: boolean;
};

/**
 * An effect function
 */
export interface EffectFn {
  /**
   * Creates a new effect for an atom
   */ <T>(
    source: Atom<T>,
    callback: EffectCallback<T>,
    options?: EffectOptions,
  ): EffectSubscription;

  /**
   * Creates a new effect for a list of atoms
   */ <TValues extends unknown[]>(
    sources: AtomList<TValues>,
    callback: EffectCallback<TValues>,
    options?: EffectOptions,
  ): EffectSubscription;
}
