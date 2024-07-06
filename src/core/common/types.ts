// istanbul ignore next
import { ATOM_SYMBOL, SIGNAL_SYMBOL } from './symbols';

/**
 * A reactive value which notifies consumers of any changes.
 *
 * Atoms are functions which returns their current value. To access the current value of an atom,
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
     * Signals that the `AtomEffect` has been destroyed
     */
    readonly onDestroyed: Signal<void>;

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
