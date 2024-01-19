import React, { FC } from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-named-as-default
import userEvent from '@testing-library/user-event';

import { Atom } from '../core';
import { declareController, ViewModel, withView } from '../core/mvc';

import { useAtoms } from './useAtoms';
import { withViewPresenter } from './withViewPresenter';

describe('withViewPresenter()', () => {
  type CounterViewModel = ViewModel<{
    state: {
      label: Atom<string>;
      value: Atom<number>;
    };

    increase(): void;
    decrease(): void;
  }>;

  const CounterView: FC<{ viewModel: CounterViewModel }> = ({ viewModel }) => {
    const { state, increase, decrease } = viewModel;
    const { value, label } = useAtoms(state);

    return (
      <>
        <span data-testid="label">{label}</span>
        <span data-testid="value">{value}</span>
        <button data-testid="increase" onClick={increase} />
        <button data-testid="decrease" onClick={decrease} />
      </>
    );
  };

  const CounterPresenter = declareController
    .extend(withView<{ initialValue: number; label: string }>())
    .apply<CounterViewModel>(({ scope, view }) => {
      const { initialValue, label } = view.props;

      const $value = scope.atom(initialValue());

      function update(delta: number) {
        $value.update((prev) => prev + delta);
      }

      return {
        state: {
          label,
          value: $value,
        },

        increase: () => update(1),
        decrease: () => update(-1),
      };
    });

  it('should return HOC with applied Presenter', async () => {
    const user = userEvent.setup();

    const TestCounter = withViewPresenter(CounterView, CounterPresenter);

    render(<TestCounter initialValue={5} label="TestLabel" />);

    expect(screen.getByTestId('label')).toHaveTextContent('TestLabel');
    expect(screen.getByTestId('value')).toHaveTextContent('5');

    await user.click(screen.getByTestId('increase'));
    expect(screen.getByTestId('value')).toHaveTextContent('6');

    await user.click(screen.getByTestId('decrease'));
    await user.click(screen.getByTestId('decrease'));
    expect(screen.getByTestId('value')).toHaveTextContent('4');
  });
});
