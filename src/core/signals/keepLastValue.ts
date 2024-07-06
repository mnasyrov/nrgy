import { createAtomSubject } from '../atomSubject';
import { DestroyableAtom, Signal } from '../common';
import { syncEffect } from '../effects/effect';
import { BaseScope } from '../scope/baseScope';

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
  const scope = new BaseScope();

  const subject = createAtomSubject<T>(initialValue as T, {
    onDestroy: scope.destroy,
  });

  const sub = scope.add(syncEffect(source, subject.next));
  scope.add(syncEffect(sub.onError, subject.error));
  scope.add(syncEffect(sub.onDestroy, subject.destroy));

  return subject.asDestroyable();
}
