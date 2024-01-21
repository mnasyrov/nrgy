import React, { FC, PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-named-as-default
import userEvent from '@testing-library/user-event';

import { Atom } from '../core';
import { ViewModel } from '../core/mvc';
import { declareViewModel } from '../core/mvc/viewModel';

import { useAtoms } from './useAtoms';
import { withViewModel } from './withViewModel';

describe('withViewModel()', () => {
  type CounterViewModelType = ViewModel<{
    props: {
      initialValue: Atom<number>;
    };

    state: {
      value: Atom<number>;
    };

    increase(): void;
    decrease(): void;
  }>;

  const CounterView: FC<
    PropsWithChildren<{ viewModel: CounterViewModelType; label: string }>
  > = ({ children, viewModel, label }) => {
    const { state, increase, decrease } = viewModel;
    const { value } = useAtoms(state);

    return (
      <>
        <span data-testid="label">{label}</span>

        <span data-testid="value">{value}</span>
        <button data-testid="increase" onClick={increase} />
        <button data-testid="decrease" onClick={decrease} />

        <div data-testid="content">{children}</div>
      </>
    );
  };

  const CounterViewModel = declareViewModel<CounterViewModelType>(
    ({ scope, view }) => {
      const { initialValue } = view.props;

      const value = scope.atom(initialValue());

      function update(delta: number) {
        value.update((prev) => prev + delta);
      }

      return {
        state: { value },

        increase: () => update(1),
        decrease: () => update(-1),
      };
    },
  );

  const CounterComponent = withViewModel(CounterView, CounterViewModel);

  it('should return HOC with applied ViewModel', async () => {
    const user = userEvent.setup();

    render(
      <CounterComponent initialValue={5} label="TestLabel">
        <span>inner-content</span>
      </CounterComponent>,
    );

    expect(screen.getByTestId('label')).toHaveTextContent('TestLabel');
    expect(screen.getByTestId('value')).toHaveTextContent('5');
    expect(screen.getByTestId('content')).toHaveTextContent('inner-content');

    await user.click(screen.getByTestId('increase'));
    expect(screen.getByTestId('value')).toHaveTextContent('6');

    await user.click(screen.getByTestId('decrease'));
    await user.click(screen.getByTestId('decrease'));
    expect(screen.getByTestId('value')).toHaveTextContent('4');
  });
});
