import { getAtomName } from '../reactivity/atomUtils';
import { compute } from '../reactivity/compute';
import { Atom } from '../reactivity/types';

/**
 * Returns a readonly version of the source atom.
 */
export function readonlyAtom<T>(source: Atom<T>): Atom<T> {
  const name = getAtomName(source);

  return compute(source, { name });
}
