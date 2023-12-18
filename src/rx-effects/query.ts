import { Query } from 'rx-effects';
import { skip } from 'rxjs';

import { AtomObservable } from '../core/atomSubject';
import { Atom } from '../core/common';
import { fromObservable, observe } from '../rxjs/_public';

export type AtomQuery<T> = Query<T> & {
  readonly source: Atom<T>;
};

export function toQuery<T>(source: Atom<T>): AtomQuery<T> {
  return {
    get: () => source(),
    value$: observe(source),
    source,
  };
}

export function fromQuery<T>(query: Query<T>): AtomObservable<T> {
  return fromObservable(query.value$.pipe(skip(1)), query.get());
}
