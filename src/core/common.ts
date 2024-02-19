export type AnyObject = Record<string, any>;
export type AnyFunction = (...args: any[]) => any;

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
 * An Atom that can be destroyed
 */
export type DestroyableAtom<T> = Atom<T> &
  Readonly<{
    /**
     * Returns a readonly version of this atom
     */
    asReadonly(): Atom<T>;

    /**
     * Destroys the atom, notifies any dependents and calls `onDestroy` callback.
     */
    destroy(): void;
  }>;

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

export type ReactiveNode = Readonly<{
  destroy: () => void;
}>;

export type AtomNode<T> = ReactiveNode &
  Readonly<{
    name?: string;
    get: () => T;
  }>;

export type ComputedNode<T> = ReactiveNode &
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

    /**
     * Signals a result of the `AtomEffect`
     */
    onResult: Signal<any>;

    /**
     * Signals an error of the `AtomEffect`
     */
    onError: Signal<unknown>;

    /**
     * Signals that the `AtomEffect` has been destroyed
     */
    onDestroy: Signal<void>;

    /**
     * Monotonically increasing counter representing a version of this `Consumer`'s
     * dependencies.
     */
    clock: number;

    notify: () => void;
    notifyDestroy: () => void;
  }>;

export type SignalNode<T> = ReactiveNode &
  Readonly<{
    name?: string;
    sync?: boolean;
    isDestroyed: boolean;

    emit: (value: T) => void;
    subscribe: (effectRef: WeakRef<SignalEffectNode<T>>) => void;
  }>;

export type SignalEffectNode<T> = ReactiveNode &
  Readonly<{
    ref: WeakRef<SignalEffectNode<T>>;
    isDestroyed: boolean;

    onResult: Signal<any>;
    onError: Signal<unknown>;
    onDestroy: Signal<void>;

    notify: (value: T) => void;
    notifyDestroy: () => void;
  }>;
