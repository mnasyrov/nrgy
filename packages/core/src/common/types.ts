export type AnyObject = Record<string, any>;

export type AnyFunction = (...args: any[]) => any;

/**
 * A comparison function which can determine if two values are equal.
 */
export type ValueEqualityFn<T> = (a: T, b: T) => boolean;
