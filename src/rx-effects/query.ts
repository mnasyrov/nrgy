import { Query } from 'rx-effects';
import { skip } from 'rxjs';

import { AtomObservable } from '../core/atomSubject';
import { Atom } from '../core/common';
import { fromObservable, observe } from '../rxjs/_public';

export function toQuery<T>(source: Atom<T>): Query<T> {
  return {
    get: () => source(),
    value$: observe(source),
  };
}

export function fromQuery<T>(query: Query<T>): AtomObservable<T> {
  return fromObservable(query.value$.pipe(skip(1)), query.get());
}
