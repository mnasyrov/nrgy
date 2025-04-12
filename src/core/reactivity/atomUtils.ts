import { ATOM_SYMBOL } from './symbols';
import { Atom, AtomNode } from './types';

/**
 * Checks if the given `value` is a reactive `Atom`.
 */
export function isAtom<T>(value: unknown): value is Atom<T> {
  return (
    typeof value === 'function' &&
    ATOM_SYMBOL in value &&
    value[ATOM_SYMBOL] !== undefined
  );
}

/**
 * @internal
 *
 * Returns `AtomNode` from the given Atom.
 */
export function getAtomNode<T>(value: Atom<T>): AtomNode {
  return value[ATOM_SYMBOL] as AtomNode;
}

/**
 * Returns a name of the given Atom.
 */
export function getAtomName(value: Atom<any>): string | undefined {
  return getAtomNode(value).name;
}
