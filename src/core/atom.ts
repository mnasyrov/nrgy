import {
  AnyObject,
  Atom,
  ATOM_SYMBOL,
  AtomNode,
  DestroyableAtom,
  ReactiveNode,
  Signal,
  ValueEqualityFn,
} from './common';
import { nextSafeInteger } from './utils/nextSafeInteger';

let ATOM_ID: number = 0;

/**
 * @internal
 */
export function generateAtomId(): number {
  return (ATOM_ID = nextSafeInteger(ATOM_ID));
}

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
 * @internal
 *
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

/** @internal */
export function getAtomId(value: Atom<any>): number {
  return getAtomNode(value).id;
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
   * Signals that the `AtomEffect` has been destroyed
   */
  readonly onDestroyed: Signal<void>;

  /**
   * Directly set the atom to a new value, and notify any dependents.
   */
  set(value: T): boolean;

  /**
   * Update the value of the atom based on its current value, and
   * notify any dependents.
   */
  update(updateFn: (value: T) => T): boolean;

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
