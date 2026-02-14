import { compute } from '../reactivity/reactivity';
import type { Atom, ComputeOptions } from '../reactivity/types';

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
