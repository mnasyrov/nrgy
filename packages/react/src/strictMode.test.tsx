import {
  type Atom,
  atom,
  declareViewModel,
  readonlyAtom,
  type ViewModel,
} from '@nrgyjs/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type FC, StrictMode } from 'react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';

import { useAtoms } from './useAtoms';
import { withViewModel } from './withViewModel';

describe('Nrgy in React.StrictMode', () => {
  type CounterViewModelType = ViewModel<{
    props: {
      initialValue: Atom<number>;
      label: Atom<string>;
      step: Atom<number>;
    };

    state: {
      label: Atom<string>;
      value: Atom<number>;
    };

    increase(): void;
  }>;

  const CounterView: FC<{ viewModel: CounterViewModelType }> = ({
    viewModel,
  }) => {
    const { label, value } = useAtoms(viewModel.state);

    return (
      <>
        <span data-testid="label">{label}</span>
        <span data-testid="value">{value}</span>
        <button data-testid="increase" onClick={() => viewModel.increase()} />
      </>
    );
  };

  const CounterViewModel = declareViewModel<CounterViewModelType>(
    ({ scope, view }) => {
      const store = scope.add(atom(view.props.initialValue()));

      return {
        state: {
          label: view.props.label,
          value: readonlyAtom(store),
        },

        increase: () => {
          store.update((value) => value + view.props.step());
        },
      };
    },
  );

  it('should render and update correctly inside StrictMode', async () => {
    const user = userEvent.setup();
    const CounterComponent = withViewModel(CounterViewModel)(CounterView);

    const { rerender, unmount } = render(
      <StrictMode>
        <CounterComponent initialValue={5} label="Alpha" step={2} />
      </StrictMode>,
    );

    expect(screen.getByTestId('label')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('value')).toHaveTextContent('5');

    await user.click(screen.getByTestId('increase'));
    await waitFor(() =>
      expect(screen.getByTestId('value')).toHaveTextContent('7'),
    );

    rerender(
      <StrictMode>
        <CounterComponent initialValue={5} label="Beta" step={3} />
      </StrictMode>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('label')).toHaveTextContent('Beta'),
    );

    await user.click(screen.getByTestId('increase'));
    await waitFor(() =>
      expect(screen.getByTestId('value')).toHaveTextContent('10'),
    );

    unmount();
  });
});
