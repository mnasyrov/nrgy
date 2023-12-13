import { createAtomSubject } from './atomSubject';
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
): Atom<T>;

export function keepLastValue<T>(
  source: Signal<T>,
  initialValue?: T,
  options?: KeepLastValueOptions,
): Atom<T | undefined>;

export function keepLastValue<T>(
  source: Signal<T>,
  initialValue?: T,
  options?: KeepLastValueOptions,
): Atom<T> {
  const scope = createScope();

  const subject = createAtomSubject<T>(initialValue as T, {
    onDestroy: scope.destroy,
  });

  const fn = options?.sync ? scope.syncEffect : scope.effect;
  fn(source, subject.next, subject.error);

  return subject.asObservable();
}
