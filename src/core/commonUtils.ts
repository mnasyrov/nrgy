import { ValueEqualityFn } from './common';

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
    if (
      !hasOwnProperty.call(objB, key) ||
      !defaultEquals(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
};
