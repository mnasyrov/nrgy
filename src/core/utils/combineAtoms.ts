import { AtomList } from '../atoms/atomTypes';
import { compute, ComputeOptions } from '../atoms/compute';
import { Atom } from '../common/types';

/**
 * Creates a new Atom which takes the latest values from source atoms
 * and combines them into an array.
 */
export function combineAtoms<TValues extends unknown[]>(
  sources: AtomList<TValues>,
  options?: ComputeOptions<TValues>,
): Atom<TValues> {
  return compute<TValues>(
    () => sources.map((source) => source()) as TValues,
    options,
  );
}
