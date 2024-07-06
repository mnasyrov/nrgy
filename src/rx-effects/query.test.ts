import { useEffect, useState } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';

import { atom, compute, effect, isAtom, signal, syncEffect } from '../core';
import { getSignalNode } from '../core/signals/signal';
import { expectEffectContext } from '../test/matchers';
import { flushMicrotasks } from '../test/testUtils';

import { fromQuery, Query, toQuery } from './query';

describe('toQuery()', () => {
  it('should return a Query-proxy for the atom', async () => {
    const source = atom(1);
    const query = toQuery(source);

    expect(query.get()).toBe(1);

    const historyPromise = firstValueFrom(query.value$.pipe(toArray()));
    await flushMicrotasks();

    source.set(2);
    expect(query.get()).toBe(2);
    await flushMicrotasks();

    source.set(3);
    expect(query.get()).toBe(3);
    await flushMicrotasks();

    source.destroy();
    source.set(4);
    expect(query.get()).toBe(3);

    const history = await historyPromise;
    expect(history).toEqual([1, 2, 3]);
  });

  it('should render with a current value of computed expression', async () => {
    const x = atom(1);
    const y = compute(() => x() * x());
    const $y = toQuery(y);

    const { result, unmount } = renderHook(() => useQuery($y));

    expect(result.current).toBe(1);

    act(() => x.set(2));
    await waitFor(() => expect(result.current).toBe(4));

    act(() => x.set(3));
    await waitFor(() => expect(result.current).toBe(9));

    unmount();
    act(() => x.set(4));
    await waitFor(() => expect(result.current).toBe(9));
  });

  it('should render with a current value of the subscribed atom', async () => {
    const x = atom(1);
    const query = toQuery(x);

    const setter = signal<number>();
    effect(setter, (value) => x.set(value));

    const { result, unmount } = renderHook(() => useQuery(query));

    expect(result.current).toBe(1);

    act(() => setter(2));
    await waitFor(() => expect(result.current).toBe(2));

    act(() => setter(3));
    await waitFor(() => expect(result.current).toBe(3));

    unmount();
    act(() => setter(4));
    await waitFor(() => expect(result.current).toBe(3));
  });
});

describe('fromQuery()', () => {
  it('should subscribe to a query and return an atom as a proxy', () => {
    const source = atom(1);
    const query = toQuery(source);
    const atomQuery = fromQuery(query);
    expect(atomQuery()).toBe(1);
  });

  it('should subscribe to a behavior subject and return an atom as a proxy', () => {
    const source = new BehaviorSubject(1);
    const query: Query<number> = {
      get: () => source.getValue(),
      value$: source.asObservable(),
    };

    const atomQuery = fromQuery(query);
    expect(atomQuery()).toBe(1);
  });

  it('should destroy the subscription on AtomQuery when the result atom is destroyed', () => {
    const source = atom(1);
    const atomQuery = toQuery(source);

    const result = fromQuery(atomQuery);
    const spy = jest.fn();
    syncEffect(result, spy);

    spy.mockClear();
    result.destroy();
    source.set(2);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should destroy the subscription on BehaviourSubject when the result atom is destroyed', () => {
    const source = new BehaviorSubject(1);
    const query: Query<number> = {
      get: () => source.getValue(),
      value$: source.asObservable(),
    };

    const result = fromQuery(query);
    const spy = jest.fn();
    syncEffect(result, spy);

    spy.mockClear();
    result.destroy();
    source.next(2);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should rethrow an error from the source', () => {
    const source = new BehaviorSubject(1);
    const query: Query<number> = {
      get: () => source.getValue(),
      value$: source.asObservable(),
    };

    const result = fromQuery(query);

    const getterSpy = jest.fn();
    const fx = syncEffect(result, getterSpy);

    const errorSpy = jest.fn();
    syncEffect(fx.onError, errorSpy);

    source.error(new Error('test error'));
    expect(() => result()).toThrow(new Error('test error'));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      new Error('test error'),
      expectEffectContext(),
    );
  });

  it('should transmit "destroy" notification from the source atom', () => {
    const source = atom(1);
    const atomQuery = toQuery(source);

    const result = fromQuery(atomQuery);
    const fx = syncEffect(result, () => {});

    source.destroy();
    expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
  });

  it('should transmit "destroy" notification from the source atom and the computed atom', () => {
    const source = atom(1);
    const computed = compute(() => source());
    const query = toQuery(computed);

    const result = fromQuery(query);
    const fx = syncEffect(result, () => {});

    source.destroy();
    expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
  });

  describe('asReadonly()', () => {
    it('should return a read-only representation of the writable Atom', () => {
      const source = atom(1);
      const atomQuery = toQuery(source);

      const result = fromQuery(atomQuery);
      const readonly = result.asReadonly();

      expect(readonly).toBeInstanceOf(Function);
      expect(isAtom(readonly)).toBe(true);
      expect(readonly()).toBe(1);

      expect(readonly).not.toEqual(
        expect.objectContaining({
          set: expect.any(Function),
          update: expect.any(Function),
          mutate: expect.any(Function),
          asReadonly: expect.any(Function),
          destroy: expect.any(Function),
        }),
      );

      expect(readonly()).toEqual(1);

      source.set(2);
      expect(readonly()).toEqual(2);
    });

    test('Read-only atom should transmit "destroy" notification', () => {
      const source = atom(1);
      const atomQuery = toQuery(source);

      const result = fromQuery(atomQuery);
      const readonly = result.asReadonly();
      const fx = syncEffect(readonly, () => {});

      source.destroy();
      expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
    });
  });
});

describe('Equivalence of toQuery/fromQuery transformation', () => {
  it('should provide the getter which returns the actual value of the source', () => {
    const source = atom(1);

    const query = toQuery(source);
    const clone = fromQuery(query);

    const isTwo = compute(() => clone() === 2);
    expect(isTwo()).toBe(false);

    source.set(2);
    expect(isTwo()).toBe(true);
  });

  it('should provide async subscriptions to actual values of the source', async () => {
    const source = atom(1);

    const query = toQuery(source);
    const clone = fromQuery(query);

    const values: number[] = [];

    effect(clone, (value) => values.push(value));
    await flushMicrotasks();
    expect(values).toEqual([1]);

    source.set(2);
    await flushMicrotasks();
    expect(values).toEqual([1, 2]);
  });
});

function useQuery<T>(query: Query<T>): T {
  const [value, setValue] = useState<T>(query.get);

  useEffect(() => {
    const subscription = query.value$.subscribe((nextValue) => {
      setValue(nextValue);
    });

    return () => subscription.unsubscribe();
  }, [query.value$]);

  return value;
}
