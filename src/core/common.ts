export type AnyObject = Record<string, any>;
export type AnyFunction = (...args: any[]) => any;

/**
 * Symbol used to indicate that an object is an Atom
 */
export const ATOM_SYMBOL = Symbol.for('ngry.atom');

/**
 * Symbol used to indicate that an object is a Signal
 */
export const SIGNAL_SYMBOL = Symbol.for('ngry.signal');

/**
 * A reactive value which notifies consumers of any changes.
 *
 * Atoms are functions which returns their current value. To access the current value of an atom,
 * call it.
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
 * Signal is an event emitter. It can be called to notify listeners of events.
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
 * A reactive node
 */
export type ReactiveNode = Readonly<{
  /** Destroys the node */
  destroy: () => void;
}>;

/**
 * An atom node
 */
export type AtomNode<T> = ReactiveNode &
  Readonly<{
    /**
     * The name of the atom
     */
    name?: string;

    /**
     * Returns the current value
     */
    get: () => T;
  }>;

/**
 * A computed node
 */
export type ComputedNode<T> = ReactiveNode &
  Readonly<{
    /**
     * The clock of the last computation
     */
    clock: number | undefined;

    /**
     * The version of the cached value
     */
    version: number;

    /**
     * Returns the current value
     */
    get: () => T;

    /**
     * Returns true if the value has changed
     */
    isChanged: () => boolean;
  }>;

export type AtomEffectNode = ReactiveNode &
  Readonly<{
    /**
     * The reference to this effect node
     */
    ref: WeakRef<AtomEffectNode>;

    /**
     * Indicates that the `AtomEffect` has been destroyed
     */
    isDestroyed: boolean;

    /**
     * Indicates that the `AtomEffect` must be re-run
     */
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

    /**
     * Schedule the effect to be re-run
     */
    notify: () => void;

    /**
     * Notify the effect that it must be destroyed
     */
    notifyDestroy: () => void;
  }>;

export type SignalNode<T> = ReactiveNode &
  Readonly<{
    /**
     * The name of the signal
     */
    name?: string;

    /**
     * If true, the SyncScheduler will be forced to use to notify consumers.
     */
    sync?: boolean;

    /**
     * Indicates that the `Signal` has been destroyed
     */
    isDestroyed: boolean;

    /**
     * Emit a value to all consumers
     */
    emit: (value: T) => void;

    /**
     * Subscribe to this signal
     */
    subscribe: (effectRef: WeakRef<SignalEffectNode<T>>) => void;
  }>;

/**
 * A signal effect node
 */
export type SignalEffectNode<T> = ReactiveNode &
  Readonly<{
    /**
     * The reference to this effect node
     */
    ref: WeakRef<SignalEffectNode<T>>;

    /**
     * Indicates that the `SignalEffect` has been destroyed
     */
    isDestroyed: boolean;

    /**
     * Signals a result of the action function
     */
    onResult: Signal<any>;

    /**
     * Signals an error of the action function
     */
    onError: Signal<unknown>;

    /**
     * Signals that the `SignalEffect` has been destroyed
     */
    onDestroy: Signal<void>;

    /**
     * Schedule the effect to be re-run
     */
    notify: (value: T) => void;

    /**
     * Notify the effect that it must be destroyed
     */
    notifyDestroy: () => void;
  }>;
