export type AnyObject = Record<string, any>;

/**
 * Symbol used to tell `Atom`s apart from other functions.
 *
 * This can be used to auto-unwrap atom in various cases, or to auto-wrap non-atom values.
 */
const ATOM_SYMBOL = Symbol.for('ngry.atom');

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
 * Checks if the given `value` is a reactive `Atom`.
 */
export function isAtom<T>(value: unknown): value is Atom<T> {
  return (
    typeof value === 'function' &&
    ATOM_SYMBOL in value &&
    value[ATOM_SYMBOL] !== undefined
  );
}

export function getAtomNode<T>(value: Atom<T>): ReactiveNode {
  return value[ATOM_SYMBOL] as ReactiveNode;
}

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
    if (!hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Converts `fn` into a marked get function (where `isAtom(fn)` will be `true`).
 *
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

export type ReactiveNode = Readonly<{
  destroy: () => void;
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
     * Monotonically increasing counter representing a version of this `Consumer`'s
     * dependencies.
     */
    clock: number;

    notify: () => void;
  }>;

export type SignalNode<T> = ReactiveNode &
  Readonly<{
    isDestroyed: boolean;
    isObserved: () => boolean;

    emit: (value: T) => void;
    subscribe: (effectRef: WeakRef<SignalEffectNode<T>>) => void;
  }>;

export type SignalEffectNode<T> = ReactiveNode &
  Readonly<{
    ref: WeakRef<SignalEffectNode<T>>;
    isDestroyed: boolean;

    notify: (value: T) => void;
  }>;
