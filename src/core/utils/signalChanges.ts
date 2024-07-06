import { Atom, Signal } from '../common/types';
import { effect } from '../effects/effect';
import { BaseScope } from '../scope/baseScope';
import { signal } from '../signals/signal';
import { SignalOptions } from '../signals/types';

/**
 * Returns a signal that emits the changes of the source atom.
 *
 * @param source - The source atom.
 * @param options - Options
 */
export function signalChanges<T>(
  source: Atom<T>,
  options?: SignalOptions<T>,
): Signal<T> {
  const scope = new BaseScope();

  if (options?.onDestroy) {
    scope.onDestroy(options.onDestroy);
  }

  const s = signal<T>({
    ...options,
    onDestroy: () => scope.destroy(),
  });

  let first = true;

  scope.add(
    effect(
      source,
      (value) => {
        if (first) {
          first = false;
        } else {
          s(value);
        }
      },
      { sync: options?.sync },
    ),
  );

  return s;
}
