import { Atom } from './common';
import { compute, ComputeOptions } from './compute';

/**
 * Creates a new Atom which maps a source value by the provided mapping
 * function.
 */
export function mapAtom<T>(
  source: Atom<T>,
  computation: (value: T) => T,
  options?: ComputeOptions<T>,
): Atom<T> {
  return compute<T>(() => computation(source()), options);
}

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

export type AtomList<TValues extends unknown[]> = [
  ...{ [K in keyof TValues]: Atom<TValues[K]> },
];

export function combineAtoms<TValues extends unknown[]>(
  sources: AtomList<TValues>,
  options?: ComputeOptions<TValues>,
): Atom<TValues> {
  return compute<TValues>(
    () => sources.map((source) => source()) as TValues,
    options,
  );
}
