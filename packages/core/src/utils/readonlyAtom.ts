import { compute, getAtomLabel } from '../reactivity/reactivity';
import type { Atom } from '../reactivity/types';

/**
 * Returns a readonly version of the source atom.
 */
export function readonlyAtom<T>(source: Atom<T>): Atom<T> {
  const label = getAtomLabel(source);

  return compute(source, { label });
}
