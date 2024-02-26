import { useEffect, useState } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';

import { atom, compute, syncEffect } from '../core';
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
