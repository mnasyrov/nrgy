import { act, renderHook, waitFor } from '@testing-library/react';

import { atom } from '../core';

import { useAtoms } from './useAtoms';

describe('useAtoms()', () => {
  it('should render with a current value and watch for value changes', async () => {
    const s1 = atom(1);
    const s2 = atom(20);

    const { result, unmount } = renderHook(() => useAtoms({ s1, s2 }));

    expect(result.current).toEqual({ s1: 1, s2: 20 });

    act(() => s1.set(2));
    await waitFor(() => expect(result.current).toEqual({ s1: 2, s2: 20 }));

    act(() => s2.set(30));
    await waitFor(() => expect(result.current).toEqual({ s1: 2, s2: 30 }));

    unmount();
    act(() => s1.set(3));
    await waitFor(() => expect(result.current).toEqual({ s1: 2, s2: 30 }));
  });

  it('should render with a current value and watch for value changes', async () => {
    const { result } = renderHook(() => useAtoms(undefined));

    expect(result.current).toEqual({});
  });
});
