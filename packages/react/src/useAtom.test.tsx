import '@testing-library/jest-dom';
import { type Atom, atom, batch, compute } from '@nrgyjs/core';
import { act, render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React, { Component, type FC, type ReactNode, StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useAtom } from './useAtom';

describe('useAtom()', () => {
  it('should render with a current value and watch for value changes', () => {
    const store = atom(1);

    const { result, unmount } = renderHook(() => useAtom(store));

    expect(result.current).toBe(1);

    act(() => store.set(2));
    expect(result.current).toBe(2);

    unmount();
    act(() => store.set(3));
    expect(result.current).toBe(2);
  });

  it('should render with a current value of computed expression', () => {
    const x = atom(1);
    const y = compute(() => x() * x());

    const { result, unmount } = renderHook(() => useAtom(y));

    expect(result.current).toBe(1);

    act(() => x.set(2));
    expect(result.current).toBe(4);

    act(() => x.set(3));
    expect(result.current).toBe(9);

    unmount();
    act(() => x.set(4));
    expect(result.current).toBe(9);
  });

  it('should render a value of a new source atom in the same commit', () => {
    const a = atom('A');
    const b = atom('B');
    const commits: string[] = [];

    const TestView: FC<{ source: Atom<string> }> = ({ source }) => {
      const value = useAtom(source);
      commits.push(value);
      return <span data-testid="value">{value}</span>;
    };

    const { rerender } = render(<TestView source={a} />);
    expect(screen.getByTestId('value')).toHaveTextContent('A');

    rerender(<TestView source={b} />);
    expect(screen.getByTestId('value')).toHaveTextContent('B');
    expect(commits).toEqual(['A', 'B']);

    act(() => a.set('A2'));
    expect(screen.getByTestId('value')).toHaveTextContent('B');

    act(() => b.set('B2'));
    expect(screen.getByTestId('value')).toHaveTextContent('B2');
    expect(commits).toEqual(['A', 'B', 'B2']);
  });

  it('should render once for several updates inside an event handler', async () => {
    const user = userEvent.setup();

    const store = atom(0);
    let renders = 0;

    const TestView: FC = () => {
      const value = useAtom(store);
      renders++;

      return (
        <button
          type="button"
          data-testid="button"
          onClick={() => {
            store.set(value + 1);
            store.set(value + 2);
          }}
        >
          {value}
        </button>
      );
    };

    render(<TestView />);
    expect(renders).toBe(1);

    await user.click(screen.getByTestId('button'));
    expect(screen.getByTestId('button')).toHaveTextContent('2');
    expect(renders).toBe(2);
  });

  it('should render once for several updates inside batch()', () => {
    const x = atom(1);
    const y = atom(2);
    const sum = compute(() => x() + y());
    let renders = 0;

    const { result } = renderHook(() => {
      renders++;
      return useAtom(sum);
    });

    expect(result.current).toBe(3);
    expect(renders).toBe(1);

    act(() => {
      batch(() => {
        x.set(10);
        y.set(20);
      });
    });

    expect(result.current).toBe(30);
    expect(renders).toBe(2);
  });

  it('should not rerender when a computed value is equal to the previous one', () => {
    const source = atom({ id: 1, name: 'a' });
    const $id = compute(() => ({ id: source().id }), {
      equal: (a, b) => a.id === b.id,
    });
    let renders = 0;

    const { result } = renderHook(() => {
      renders++;
      return useAtom($id);
    });

    const firstValue = result.current;
    expect(firstValue).toEqual({ id: 1 });
    expect(renders).toBe(1);

    act(() => source.set({ id: 1, name: 'b' }));
    expect(result.current).toBe(firstValue);
    expect(renders).toBe(1);

    act(() => source.set({ id: 2, name: 'b' }));
    expect(result.current).toEqual({ id: 2 });
    expect(renders).toBe(2);
  });

  it('should subscribe and unsubscribe without leaks in StrictMode', () => {
    const store = atom(1);

    // A lazy computed atom is recomputed on a change only while an effect
    // is subscribed to it, so the counter reveals leaked subscriptions.
    let computations = 0;
    const $tracked = compute(() => {
      computations++;
      return store();
    });

    const TestView: FC = () => {
      const value = useAtom($tracked);
      return <span data-testid="value">{value}</span>;
    };

    const { unmount } = render(
      <StrictMode>
        <TestView />
      </StrictMode>,
    );
    expect(screen.getByTestId('value')).toHaveTextContent('1');

    act(() => store.set(2));
    expect(screen.getByTestId('value')).toHaveTextContent('2');
    const computationsBeforeUnmount = computations;

    unmount();

    act(() => store.set(3));
    expect(computations).toBe(computationsBeforeUnmount);
  });

  it('should throw a render error when the atom starts throwing', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const source = atom(1);
    const $value = compute(() => {
      const value = source();
      if (value === 2) {
        throw new Error('boom');
      }
      return value;
    });

    class ErrorBoundary extends Component<
      { children: ReactNode },
      { error?: Error }
    > {
      override state: { error?: Error } = {};

      static getDerivedStateFromError(error: Error) {
        return { error };
      }

      override render() {
        return this.state.error ? (
          <span data-testid="error">{this.state.error.message}</span>
        ) : (
          this.props.children
        );
      }
    }

    const TestView: FC = () => {
      const value = useAtom($value);
      return <span data-testid="value">{value}</span>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <TestView />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('value')).toHaveTextContent('1');

    // The effect swallows the error, the last value is kept until the next render
    act(() => source.set(2));
    expect(screen.getByTestId('value')).toHaveTextContent('1');

    rerender(
      <ErrorBoundary>
        <TestView />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error')).toHaveTextContent('boom');

    consoleError.mockRestore();
  });

  it('should keep the last value after the atom is destroyed', () => {
    const store = atom(1);

    const { result } = renderHook(() => useAtom(store));
    expect(result.current).toBe(1);

    act(() => store.destroy());
    act(() => store.set(2));
    expect(result.current).toBe(1);
  });
});
