import React, { FC } from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-named-as-default
import userEvent from '@testing-library/user-event';

import { Atom } from '../core';
import {
  createViewProxy,
  declareViewModel,
  provideView,
  ViewModel,
} from '../mvc';
import { useAtoms } from '../react';

import { ViewControllerProvider } from './ViewControllerProvider';
import { withProvidedViewModel } from './withProvidedViewModel';

describe('withProvidedViewModel()', () => {
  type CounterViewModelType = ViewModel<{
    state: { value: Atom<number> };
    increase(): void;
  }>;

  const CounterView: FC<{ viewModel: CounterViewModelType; label: string }> = ({
    viewModel,
    label,
  }) => {
    const { value } = useAtoms(viewModel.state);

    return (
      <>
        <span data-testid="label">{label}</span>
        <span data-testid="value">{value}</span>

        <button data-testid="increase" onClick={() => viewModel.increase()} />
      </>
    );
  };

  const CounterViewModel = declareViewModel<CounterViewModelType>(
    ({ scope }) => {
      const value = scope.atom(0);

      return {
        state: { value },
        increase: () => value.update((prev) => prev + 1),
      };
    },
  );

  it('should return HOC with applied ViewModel', async () => {
    const user = userEvent.setup();

    const CounterComponent =
      withProvidedViewModel(CounterViewModel)(CounterView);

    const view = createViewProxy();
    const viewModel = new CounterViewModel([provideView(view)]);

    render(
      <ViewControllerProvider
        declaration={CounterViewModel}
        controller={viewModel}
      >
        <div data-testid="counter1">
          <CounterComponent label="label1" />
        </div>

        <div data-testid="counter2">
          <CounterComponent label="label2" />
        </div>
      </ViewControllerProvider>,
    );

    const counter1 = document.querySelector(`[data-testid="counter1"]`);
    const counter2 = document.querySelector(`[data-testid="counter2"]`);

    expect(counter1?.querySelector(`[data-testid="label"]`)).toHaveTextContent(
      'label1',
    );
    expect(counter1?.querySelector(`[data-testid="value"]`)).toHaveTextContent(
      '0',
    );
    expect(counter2?.querySelector(`[data-testid="label"]`)).toHaveTextContent(
      'label2',
    );
    expect(counter2?.querySelector(`[data-testid="value"]`)).toHaveTextContent(
      '0',
    );

    await user.click(screen.queryAllByTestId('increase')[0]);
    await user.click(screen.queryAllByTestId('increase')[1]);
    expect(counter1?.querySelector(`[data-testid="value"]`)).toHaveTextContent(
      '2',
    );
    expect(counter2?.querySelector(`[data-testid="value"]`)).toHaveTextContent(
      '2',
    );
  });
});
