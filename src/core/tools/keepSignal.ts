import { createAtomSubject } from '../atomSubject';
import { Atom, Signal } from '../common';
import { createScope } from '../scope';

export function keepSignal<T>(source: Signal<T>): Atom<T | undefined>;

export function keepSignal<T>(source: Signal<T>, initialValue: T): Atom<T>;

export function keepSignal<T>(source: Signal<T>, initialValue?: T): Atom<T> {
  const scope = createScope();

  const subject = createAtomSubject<T>(initialValue as T, {
    onDestroy: scope.destroy,
  });

  scope.effect(source, subject.next, subject.error);

  return subject.asObservable();
}
