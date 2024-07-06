import { ValueEqualityFn } from './types';

/**
 * The default equality function used for `atom` and `compute`, which treats values using identity semantics.
 */
export const defaultEquals: ValueEqualityFn<unknown> = Object.is;
