import { defaultEquals } from '../common/defaultEquals';
import { ValueEqualityFn } from '../common/types';

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * An equality function which compares two objects using their own keys
 */
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
