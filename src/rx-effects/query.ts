import { Query } from 'rx-effects';
import { Subscription } from 'rxjs';

import { Signal } from '../core/common';
import { signal } from '../core/signal';
import { toObservable } from '../rxjs/_public';

export function toQuery<T>(source: Signal<T>): Query<T> {
  return {
    get: () => source(),
    value$: toObservable(source),
  };
}

export function fromQuery<T>(query: Query<T>): Signal<T> {
  let subscription: Subscription | undefined = undefined;

  const result = signal(query.get(), {
    onDestroy: () => subscription?.unsubscribe(),
  });

  subscription = query.value$.subscribe((value) => {
    result.set(value);
  });

  return result;
}
