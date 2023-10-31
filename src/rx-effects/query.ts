import { Query } from 'rx-effects';
import { Subscription } from 'rxjs';

import { atom } from '../core/atom';
import { Atom } from '../core/common';
import { observe } from '../rxjs/_public';

export function toQuery<T>(source: Atom<T>): Query<T> {
  return {
    get: () => source(),
    value$: observe(source),
  };
}

export function fromQuery<T>(query: Query<T>): Atom<T> {
  let subscription: Subscription | undefined = undefined;

  const result = atom(query.get(), {
    onDestroy: () => subscription?.unsubscribe(),
  });

  subscription = query.value$.subscribe((value) => {
    result.set(value);
  });

  return result;
}
