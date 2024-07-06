import { Atom } from '../common/types';

/**
 * Type for an array of atoms
 */
export type AtomList<TValues extends unknown[]> = [
  ...{ [K in keyof TValues]: Atom<TValues[K]> },
];
