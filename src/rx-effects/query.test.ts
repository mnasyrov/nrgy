import { useEffect, useState } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { firstValueFrom, NEVER } from 'rxjs';
import { toArray } from 'rxjs/operators';

import { atom, compute } from '../core';
import { flushMicrotasks } from '../test/testUtils';

import { isAtomQuery, Query, toQuery } from './query';

describe('isAtomQuery()', () => {
  it('should return "true" in case a query is AtomQuery object', () => {
    const query = { get: () => 1, value$: NEVER };
    const atomQuery = { get: () => 1, value$: NEVER, source: atom(2) };

    expect(isAtomQuery(query)).toBe(false);
    expect(isAtomQuery(atomQuery)).toBe(true);
  });
});

describe('toQuery()', () => {
  it('should return a Query-proxy for the atom', async () => {
    const source = atom(1);
    const query = toQuery(source);

    expect(query.get()).toBe(1);
    expect(query.source()).toBe(1);

    const historyPromise = firstValueFrom(query.value$.pipe(toArray()));
    await flushMicrotasks();

    source.set(2);
    expect(query.get()).toBe(2);
    expect(query.source()).toBe(2);
    await flushMicrotasks();

    source.set(3);
    expect(query.get()).toBe(3);
    expect(query.source()).toBe(3);
    await flushMicrotasks();

    source.destroy();
    source.set(4);
    expect(query.get()).toBe(3);
    expect(query.source()).toBe(3);

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
