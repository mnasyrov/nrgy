import { createAtomSubject } from './atomSubject';
import { Atom, DestroyableAtom, Signal } from './common';
import { effect } from './effect';
import { createScope } from './scope/createScope';
import { isSignal, signal, SignalOptions } from './signal';

/**
 * Returns an atom which remembers the last emitter value.
 *
 * @param source - The source signal.
 */
export function keepLastValue<T>(
  source: Signal<T>,
): DestroyableAtom<T | undefined>;

/**
 * Returns an atom which remembers the last emitter value.
 *
 * @param source - The source signal.
 * @param initialValue - The initial value.
 */
export function keepLastValue<T>(
  source: Signal<T>,
  initialValue: T,
): DestroyableAtom<T>;

/**
 * Returns an atom which remembers the last emitter value.
 *
 * @param source - The source signal.
 * @param initialValue - The initial value.
 */
export function keepLastValue<T>(
  source: Signal<T>,
  initialValue?: T,
): DestroyableAtom<T | undefined>;

/**
 * Returns an atom which remembers the last emitter value.
 *
 * @param source - The source signal.
 * @param initialValue - The initial value.
 */
export function keepLastValue<T>(
  source: Signal<T>,
  initialValue?: T,
): DestroyableAtom<T> {
  const scope = createScope();

  const subject = createAtomSubject<T>(initialValue as T, {
    onDestroy: scope.destroy,
  });

  const sub = scope.syncEffect(source, subject.next);
  scope.syncEffect(sub.onError, subject.error);
  scope.syncEffect(sub.onDestroy, subject.destroy);

  return subject.asDestroyable();
}

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
  const scope = createScope();

  if (options?.onDestroy) {
    scope.onDestroy(options.onDestroy);
  }

  const s = scope.signal<T>({
    ...options,
    onDestroy: () => scope.destroy(),
  });

  let first = true;

  scope.effect(
    source,
    (value) => {
      if (first) {
        first = false;
      } else {
        s(value);
      }
    },
    { sync: options?.sync },
  );

  return s;
}

type MixSignalsSources<TValues extends unknown[]> = [
  ...{ [K in keyof TValues]: Signal<TValues[K]> },
];

/**
 * Mixes multiple signals into a single signal
 */
export function mixSignals<TValues extends unknown[]>(
  sources: MixSignalsSources<TValues>,
  options?: SignalOptions<TValues[number]>,
): Signal<TValues[number]> {
  type TResult = TValues[number];

  const resultSignal = signal<TResult>(options);

  for (const source of sources) {
    if (isSignal(source)) {
      effect(source, resultSignal, { sync: options?.sync });
    }
  }

  return resultSignal;
}
