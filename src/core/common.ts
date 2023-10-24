export type AnyObject = Record<string, any>;

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Symbol used to tell `Signal`s apart from other functions.
 *
 * This can be used to auto-unwrap angular in various cases, or to auto-wrap non-signal values.
 */
const SIGNAL_SYMBOL = Symbol.for('ngry.signal');

/**
 * A reactive value which notifies consumers of any changes.
 *
 * Signals are functions which returns their current value. To access the current value of a signal,
 * call it.
 *
 * Ordinary values can be turned into `Signal`s with the `signal` function.
 */
export type Signal<T> = (() => T) &
  Readonly<{
    [SIGNAL_SYMBOL]: unknown;

    toJSON(): T;

    toString(): string;

    valueOf(): T;
  }>;

/**
 * Checks if the given `value` is a reactive `Signal`.
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return (
    typeof value === 'function' &&
    SIGNAL_SYMBOL in value &&
    value[SIGNAL_SYMBOL] !== undefined
  );
}

export function getSignalNode<T>(value: Signal<T>): ReactiveNode {
  return value[SIGNAL_SYMBOL] as ReactiveNode;
}

/**
 * A comparison function which can determine if two values are equal.
 */
export type ValueEqualityFn<T> = (a: T, b: T) => boolean;

/**
 * The default equality function used for `signal` and `computed`, which treats values using identity semantics.
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
 * Converts `fn` into a marked signal function (where `isSignal(fn)` will be `true`).
 *
 * @param fn A zero-argument function which will be converted into a `Signal`.
 */
export function createSignalFromFunction<T>(
  node: ReactiveNode,
  fn: () => T,
): Signal<T>;

/**
 * Converts `fn` into a marked signal function (where `isSignal(fn)` will be `true`), and
 * potentially add some set of extra properties (passed as an object record `extraApi`).
 *
 * @param fn A zero-argument function which will be converted into a `Signal`.
 * @param extraApi An object whose properties will be copied onto `fn` in order to create a specific
 *     desired interface for the `Signal`.
 */
export function createSignalFromFunction<T, U extends Record<string, unknown>>(
  node: ReactiveNode,
  fn: () => T,
  extraApi: U,
): Signal<T> & U;

/**
 * Converts `fn` into a marked signal function (where `isSignal(fn)` will be `true`), and
 * potentially add some set of extra properties (passed as an object record `extraApi`).
 */
export function createSignalFromFunction<
  T,
  U extends Record<string, unknown> = AnyObject,
>(node: ReactiveNode, fn: () => T, extraApi: U = {} as U): Signal<T> & U {
  (fn as any)[SIGNAL_SYMBOL] = node;
  // Copy properties from `extraApi` to `fn` to complete the desired API of the `Signal`.
  return Object.assign(fn, extraApi) as Signal<T> & U;
}

export type ReactiveNode = Readonly<{
  destroy: () => void;
}>;

export type ComputedNode<T> = ReactiveNode &
  Readonly<{
    clock: number | undefined;
    version: number;
    signal: () => T;
    isChanged: () => boolean;
  }>;

export type EffectNode = ReactiveNode &
  Readonly<{
    ref: WeakRef<EffectNode>;
    isDestroyed: boolean;
    dirty: boolean;

    /**
     * Monotonically increasing counter representing a version of this `Consumer`'s
     * dependencies.
     */
    clock: number;

    notify: () => void;
  }>;

export type ActionNode<T> = ReactiveNode &
  Readonly<{
    isDestroyed: boolean;

    emit: (value: T) => void;
    subscribe: (effectRef: WeakRef<ActionEffectNode<T>>) => void;
  }>;

export type ActionEffectNode<T> = ReactiveNode &
  Readonly<{
    ref: WeakRef<ActionEffectNode<T>>;
    isDestroyed: boolean;

    notify: (value: T) => void;
  }>;
