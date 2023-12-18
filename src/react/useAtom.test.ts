import { act, renderHook, waitFor } from '@testing-library/react';

import { atom } from '../core';
import { flushMicrotasks } from '../test/testUtils';

import { useAtom } from './useAtom';

describe('useQuery()', () => {
  it('should render with a current value and watch for value changes', async () => {
    const store = atom(1);

    const { result, unmount } = renderHook(() => useAtom(store));

    await flushMicrotasks();

    expect(result.current).toBe(1);

    act(() => store.set(2));
    await waitFor(() => expect(result.current).toBe(2));

    unmount();
    act(() => store.set(3));
    await waitFor(() => expect(result.current).toBe(2));
  });
});
