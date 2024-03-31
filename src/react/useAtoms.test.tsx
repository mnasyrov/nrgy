import React, { FC, PropsWithChildren } from 'react';
import '@testing-library/jest-dom';

import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';

import { Atom, atom } from '../core';
import { declareViewModel, ViewModel } from '../mvc';
import { withViewModel } from '../mvc-react';
import { flushMicrotasks } from '../test/testUtils';

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

describe('useAtoms() with a view model', () => {
  it('should render with a current value and watch for value changes', async () => {
    const s1 = atom(1);
    const s2 = atom(20);

    type TestViewModelType = ViewModel<{
      state: { s1: Atom<number>; s2: Atom<number> };
    }>;

    const TestViewModel = declareViewModel().apply<TestViewModelType>(() => {
      return { state: { s1, s2 } };
    });

    const TestView: FC<PropsWithChildren<{ viewModel: TestViewModelType }>> = ({
      viewModel,
    }) => {
      const { s1, s2 } = useAtoms(viewModel.state);

      return (
        <>
          <span data-testid="s1">{s1}</span>
          <span data-testid="s2">{s2}</span>
        </>
      );
    };

    const TestComponent = withViewModel(TestViewModel)(TestView);

    render(<TestComponent />);
    expect(screen.getByTestId('s1')).toHaveTextContent('1');
    expect(screen.getByTestId('s2')).toHaveTextContent('20');

    await act(async () => {
      s1.set(2);
      await flushMicrotasks();
    });
    expect(screen.getByTestId('s1')).toHaveTextContent('2');
    expect(screen.getByTestId('s2')).toHaveTextContent('20');
  });
});
