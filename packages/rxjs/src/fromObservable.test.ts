import { BehaviorSubject, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { fromObservable } from './fromObservable';

describe('fromObservable()', () => {
  it('should reflect the last emitted value of an Observable', () => {
    const counter$ = new BehaviorSubject(0);
    const counter = fromObservable(counter$);

    expect(counter()).toBe(0);
    counter$.next(1);
    expect(counter()).toBe(1);
    counter$.next(3);
    expect(counter()).toBe(3);
  });

  it('should unsubscribe from source when atom is destroyed', () => {
    // Minimal observable that exposes unsubscribe
    const unsub = { unsubscribe: vi.fn() };
    const observable = {
      subscribe: () => unsub,
    } as any;

    const state = fromObservable<number>(observable);
    expect(unsub.unsubscribe).toHaveBeenCalledTimes(0);

    (state as any).destroy();
    expect(unsub.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should notify when the last emitted value of an Observable changes', () => {
    const counter$ = new BehaviorSubject(1);
    const counter = fromObservable(counter$);

    expect(counter()).toBe(1);

    counter$.next(2);
    expect(counter()).toBe(2);
  });

  it('should propagate an error returned by the Observable', () => {
    const counter$ = new BehaviorSubject(1);
    const counter = fromObservable(counter$);

    expect(counter()).toBe(1);

    counter$.error('fail');
    expect(counter).toThrow('fail');
  });

  describe('with no initial value', () => {
    it('should return `undefined` if read before a value is emitted', () => {
      const counter$ = new Subject<number>();
      const counter = fromObservable(counter$);

      expect(counter()).toBeUndefined();
      counter$.next(1);
      expect(counter()).toBe(1);
    });

    it('should not throw if a value is emitted before called', () => {
      const counter$ = new Subject<number>();
      const counter = fromObservable(counter$);

      counter$.next(1);
      expect(() => counter()).not.toThrow();
    });
  });
});
