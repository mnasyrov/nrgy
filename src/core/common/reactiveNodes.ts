import { Signal } from './types';

/**
 * @internal
 *
 * A reactive node
 */
export type ReactiveNode = Readonly<{
  /** Destroys the node */
  destroy: () => void;
}>;

/**
 * @internal
 *
 * An atom node
 */
export type AtomNode<T> = ReactiveNode &
  Readonly<{
    /**
     * The id of the atom
     */
    id: number;

    /**
     * The name of the atom
     */
    name?: string;

    /**
     * The version of the cached value
     */
    version: number;

    /**
     * Returns the current value
     */
    get: () => T;
  }>;

/**
 * @internal
 *
 * A computed node
 */
export type ComputedNode<T> = AtomNode<T> &
  Readonly<{
    /**
     * The clock of the last computation
     */
    clock: number | undefined;
  }>;

/**
 * @internal
 *
 * An atom node
 */
export type WritableAtomNode<T> = ReactiveNode &
  AtomNode<T> &
  Readonly<{
    /**
     * Subscribe to the atom
     */
    subscribe: (effect: AtomEffectNode) => boolean;

    // /**
    //  * Unsubscribe from the atom
    //  */
    // unsubscribe: (effect: AtomEffectNode) => void;
  }>;

/**
 * @internal
 */
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
     * Notify the effect that an atom has been accessed
     */
    notifyAccess: (atom: WritableAtomNode<unknown>) => void;

    /**
     * Schedule the effect to be re-run
     */
    notify: () => void;

    /**
     * Notify the effect that it may be destroyed
     */
    notifyDestroy: () => void;
  }>;

/**
 * @internal
 */
export type SignalNode<T> = ReactiveNode &
  Readonly<{
    ref: WeakRef<SignalNode<T>>;

    /**
     * The name of the signal
     */
    name?: string;

    /**
     * If true, the SyncScheduler will be forced to use to notify consumers.
     */
    sync?: boolean;

    /**
     * Indicates that the `Signal` is subscribed
     */
    isSubscribed(): boolean;

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
    subscribe: (effect: SignalEffectNode<T>) => void;

    /**
     * Unsubscribe from this signal
     */
    unsubscribe: (effect: SignalEffectNode<T>) => void;
  }>;

/**
 * @internal
 *
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
