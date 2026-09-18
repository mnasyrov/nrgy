import '@testing-library/jest-dom';
import {
  type Atom,
  atom,
  declareViewModel,
  type ViewModel,
} from '@nrgyjs/core';
import { act, render, renderHook, screen } from '@testing-library/react';
import React, { type FC, type PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';

import { useAtoms } from './useAtoms';
import { withViewModel } from './withViewModel';

describe('useAtoms()', () => {
  it('should render with a current value and watch for value changes', () => {
    const s1 = atom(1);
    const s2 = atom(20);

    const { result, unmount } = renderHook(() => useAtoms({ s1, s2 }));

    expect(result.current).toEqual({ s1: 1, s2: 20 });

    act(() => s1.set(2));
    expect(result.current).toEqual({ s1: 2, s2: 20 });

    act(() => s2.set(30));
    expect(result.current).toEqual({ s1: 2, s2: 30 });

    unmount();
    act(() => s1.set(3));
    expect(result.current).toEqual({ s1: 2, s2: 30 });
  });

  it('should render an empty result for undefined sources', () => {
    const { result } = renderHook(() => useAtoms(undefined));

    expect(result.current).toEqual({});
  });

  it('should render once per change when sources are created inline', () => {
    const s1 = atom(1);
    const s2 = atom(20);
    let renders = 0;

    const { result } = renderHook(() => {
      renders++;
      return useAtoms({ s1, s2 });
    });

    expect(renders).toBe(1);

    act(() => s1.set(2));
    expect(result.current).toEqual({ s1: 2, s2: 20 });
    expect(renders).toBe(2);

    act(() => s2.set(30));
    expect(result.current).toEqual({ s1: 2, s2: 30 });
    expect(renders).toBe(3);
  });

  it('should keep the result identity while sources are the same', () => {
    const s1 = atom(1);
    const s2 = atom(20);

    const { result, rerender } = renderHook(() => useAtoms({ s1, s2 }));

    const firstResult = result.current;
    expect(firstResult).toEqual({ s1: 1, s2: 20 });

    rerender();
    expect(result.current).toBe(firstResult);

    act(() => s1.set(1));
    expect(result.current).toBe(firstResult);

    act(() => s1.set(2));
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual({ s1: 2, s2: 20 });
  });

  it('should render values of new sources in the same commit', () => {
    const a = atom('a');
    const b = atom('b');
    const c = atom('c');

    const { result, rerender } = renderHook(
      ({ sources }) => useAtoms(sources),
      {
        initialProps: {
          sources: { x: a, y: b } as Record<string, Atom<string>>,
        },
      },
    );

    expect(result.current).toEqual({ x: 'a', y: 'b' });

    rerender({ sources: { x: a, y: c } });
    expect(result.current).toEqual({ x: 'a', y: 'c' });

    rerender({ sources: { x: a, y: c, z: b } });
    expect(result.current).toEqual({ x: 'a', y: 'c', z: 'b' });

    act(() => b.set('b2'));
    expect(result.current).toEqual({ x: 'a', y: 'c', z: 'b2' });

    rerender({ sources: { x: a } });
    expect(result.current).toEqual({ x: 'a' });

    act(() => c.set('c2'));
    expect(result.current).toEqual({ x: 'a' });
  });
});

describe('useAtoms() with a view model', () => {
  it('should render with a current value and watch for value changes', () => {
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

    act(() => s1.set(2));
    expect(screen.getByTestId('s1')).toHaveTextContent('2');
    expect(screen.getByTestId('s2')).toHaveTextContent('20');
  });
});
