import { MonoTypeOperatorFunction, Subscription } from 'rxjs';

import { atom } from '../core/atom';
import { Atom } from '../core/common';

import { observe } from './observe';

/**
 * Creates a deferred or transformed view of the atom.
 */
export function pipeAtom<T>(
  source: Atom<T>,
  operator: MonoTypeOperatorFunction<T>,
): Atom<T> {
  let subscription: Subscription | undefined;

  const clone = atom<T>(source(), {
    onDestroy: () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    },
  });

  subscription = observe(source)
    .pipe(operator)
    .subscribe({
      next: (state) => clone.set(state),
      complete: () => clone.destroy(),
    });

  return clone;
}
