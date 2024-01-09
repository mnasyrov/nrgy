import { Observable, skip } from 'rxjs';

import { Atom, AtomObservable, compute, isAtom } from '../core';
import { createAtomFromFunction, getAtomNode } from '../core/atom';
import { fromObservable, observe } from '../rxjs';

// NOTE: Query is copy-pasted from 'rx-effects' to not use it as dependency.

/**
 * Provider for a value of a state.
 */
export type Query<T> = Readonly<{
  /** Returns the value of a state */
  get: () => T;

  /** `Observable` for value changes.  */
  value$: Observable<T>;
}>;

export type AtomQuery<T> = Query<T> & {
  readonly source: Atom<T>;
};

export function isAtomQuery<T>(query: Query<T>): query is AtomQuery<T> {
  return 'source' in query && isAtom(query.source);
}

export function toQuery<T>(source: Atom<T>): AtomQuery<T> {
  return {
    get: () => source(),
    value$: observe(source),
    source,
  };
}

export function fromQuery<T>(query: Query<T>): AtomObservable<T> {
  if (isAtomQuery(query)) {
    const { source } = query;

    const proxy = compute(() => source());
    const node = getAtomNode(proxy);

    return createAtomFromFunction(node, node.get.bind(node), {
      destroy: () => node.destroy(),
      asReadonly: () => proxy,
    });
  }

  return fromObservable(query.value$.pipe(skip(1)), query.get());
}
