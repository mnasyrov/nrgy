export type AnyObject = Record<string, any>;

/**
 * Symbol used to tell `Atom`s apart from other functions.
 *
 * This can be used to auto-unwrap atom in various cases, or to auto-wrap non-atom values.
 */
export const ATOM_SYMBOL = Symbol.for('ngry.atom');

export const SIGNAL_SYMBOL = Symbol.for('ngry.signal');

/**
 * A reactive value which notifies consumers of any changes.
 *
 * Atoms are functions which returns their current value. To access the current value of an atom,
 * call it.
 *
 * Ordinary values can be turned into `Atom`s with the `get` function.
 */
export type Atom<T> = (() => T) & {
  readonly [ATOM_SYMBOL]: unknown;
};

/**
 * Signal is an event emitter
 *
 * @param operator Optional transformation or handler for an event
 *
 * @field event$ - Observable for emitted events.
 *
 * @example
 * ```ts
 * // Create the signal
 * const submitForm = signal<{login: string, password: string}>();
 *
 * // Call the signal
 * submitForm({login: 'foo', password: 'bar'});
 *
 * // Handle signal's events
 * effect(submitForm, (formData) => {
 *   // Process the formData
 * });
 * ```
 */
export type Signal<Event> = {
  (event: Event): void;
  readonly [SIGNAL_SYMBOL]: unknown;
} & ([Event] extends [undefined | void]
  ? { (event?: Event): void }
  : { (event: Event): void });

/**
 * A comparison function which can determine if two values are equal.
 */
export type ValueEqualityFn<T> = (a: T, b: T) => boolean;

/**
 * The default equality function used for `atom` and `compute`, which treats values using identity semantics.
 */
export const defaultEquals: ValueEqualityFn<unknown> = Object.is;

const hasOwnProperty = Object.prototype.hasOwnProperty;

export const objectEquals: ValueEqualityFn<
  Readonly<Record<string, unknown>>
> = (objA, objB): boolean => {
  if (objA === objB) {
    return true;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !hasOwnProperty.call(objB, key) ||
      !defaultEquals(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
};

export type ReactiveNode = Readonly<{
  destroy: () => void;
}>;

export type AtomNode<T> = ReactiveNode &
  Readonly<{
    get: () => T;
  }>;

export type ComputedNode<T> = AtomNode<T> &
  Readonly<{
    clock: number | undefined;
    version: number;
    get: () => T;
    isChanged: () => boolean;
  }>;

export type AtomEffectNode = ReactiveNode &
  Readonly<{
    ref: WeakRef<AtomEffectNode>;
    isDestroyed: boolean;
    dirty: boolean;
    next: Signal<any>;

    /**
     * Monotonically increasing counter representing a version of this `Consumer`'s
     * dependencies.
     */
    clock: number;

    notify: () => void;
  }>;

export type SignalNode<T> = ReactiveNode &
  Readonly<{
    isDestroyed: boolean;

    emit: (value: T) => void;
    subscribe: (effectRef: WeakRef<SignalEffectNode<T>>) => void;
  }>;

export type SignalEffectNode<T> = ReactiveNode &
  Readonly<{
    ref: WeakRef<SignalEffectNode<T>>;
    isDestroyed: boolean;

    notify: (value: T) => void;
  }>;
