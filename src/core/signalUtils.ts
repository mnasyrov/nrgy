import { AtomObservable, createAtomSubject } from './atomSubject';
import { Atom, Signal } from './common';
import { createScope } from './scope';

type KeepLastValueOptions = {
  sync?: boolean;
};

export function keepLastValue<T>(source: Signal<T>): Atom<T | undefined>;

export function keepLastValue<T>(
  source: Signal<T>,
  initialValue: T,
  options?: KeepLastValueOptions,
): AtomObservable<T>;

export function keepLastValue<T>(
  source: Signal<T>,
  initialValue?: T,
  options?: KeepLastValueOptions,
): AtomObservable<T | undefined>;

export function keepLastValue<T>(
  source: Signal<T>,
  initialValue?: T,
  options?: KeepLastValueOptions,
): AtomObservable<T> {
  const scope = createScope();

  const subject = createAtomSubject<T>(initialValue as T, {
    onDestroy: scope.destroy,
  });

  const effectFn = options?.sync ? scope.syncEffect : scope.effect;
  const sub = effectFn(source, subject.next);
  effectFn(sub.onError, subject.error);
  effectFn(sub.onDestroy, subject.destroy);

  return subject.asObservable();
}
