import { compute, ComputeOptions } from '../atoms/compute';
import { Atom } from '../common/types';

/**
 * Creates a new Atom which takes the latest values from source queries
 * and merges them into a single value.
 */
export function mergeAtoms<TValues extends unknown[], TResult>(
  sources: [...{ [K in keyof TValues]: Atom<TValues[K]> }],
  computation: (...values: TValues) => TResult,
  options?: ComputeOptions<TResult>,
): Atom<TResult> {
  return compute(() => {
    const values = sources.map((source) => source());
    return computation(...(values as TValues));
  }, options);
}
