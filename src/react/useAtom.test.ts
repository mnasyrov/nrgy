import { act, renderHook, waitFor } from '@testing-library/react';

import { atom, compute } from '../core';

import { useAtom } from './useAtom';

describe('useAtom()', () => {
  it('should render with a current value and watch for value changes', async () => {
    const store = atom(1);

    const { result, unmount } = renderHook(() => useAtom(store));

    expect(result.current).toBe(1);

    act(() => store.set(2));
    await waitFor(() => expect(result.current).toBe(2));

    unmount();
    act(() => store.set(3));
    await waitFor(() => expect(result.current).toBe(2));
  });

  it('should render with a current value of computed expression', async () => {
    const x = atom(1);
    const y = compute(() => x() * x());

    const { result, unmount } = renderHook(() => useAtom(y));

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
