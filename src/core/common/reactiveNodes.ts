import { DataRef } from './utilityTypes';

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
  AtomConsumer &
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
export type WritableAtomNode<T> = ReactiveNode & AtomNode<T>;

/**
 * @internal
 */
export type AtomConsumer = ReactiveNode &
  Readonly<{
    /**
     * The reference to this effect node
     */
    ref: DataRef<AtomConsumer>;

    /**
     * Schedule the effect to be re-run
     */
    notify: () => void;
  }>;

/**
 * @internal
 */
export type AtomEffectNode = ReactiveNode &
  AtomConsumer &
  Readonly<{
    /**
     * The reference to this effect node
     */
    ref: DataRef<AtomEffectNode>;

    /**
     * Indicates that the `AtomEffect` has been destroyed
     */
    isDestroyed: boolean;

    /**
     * Indicates that the `AtomEffect` must be re-run
     */
    dirty: boolean;

    /**
     * Schedule the effect to be re-run
     */
    notify: () => void;
  }>;
