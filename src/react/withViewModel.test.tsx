import React, { FC, PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-named-as-default
import userEvent from '@testing-library/user-event';
import { createContainer, token } from 'ditox';
import { CustomDependencyContainer } from 'ditox-react';

import { Atom } from '../core';
import { declareViewModel, ViewModel } from '../core/mvc';
import { declareStore } from '../core/store';
import { withInjections } from '../ditox';
import { DitoxNrgyReactExtension } from '../ditox-react';

import { useAtom } from './useAtom';
import { useAtoms } from './useAtoms';
import { useProvidedViewController } from './ViewControllerProvider';
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

  const CounterStore = declareStore<number>({
    initialState: 0,
    updates: {
      increase: () => (state) => state + 1,
      decrease: () => (state) => state - 1,
    },
  });

  const CounterViewModel = declareViewModel<CounterViewModelType>(
    ({ scope, view }) => {
      const { initialValue } = view.props;

      const store = scope.add(new CounterStore(initialValue()));

      return {
        state: { value: store.asReadonly() },

        increase: store.updates.increase,
        decrease: store.updates.decrease,
      };
    },
  );

  it('should return HOC with applied ViewModel', async () => {
    const user = userEvent.setup();

    const CounterComponent = withViewModel(CounterView, CounterViewModel);

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

  it('should provide the view model to children', async () => {
    const user = userEvent.setup();

    const CounterComponent = withViewModel(CounterView, CounterViewModel);

    const ChildComponent: FC = () => {
      const viewModel = useProvidedViewController(CounterViewModel);

      const result = useAtom(viewModel.state.value) * 10;

      return <>Child value: {result}</>;
    };

    render(
      <CounterComponent initialValue={5} label="TestLabel">
        <ChildComponent />
      </CounterComponent>,
    );

    expect(screen.getByTestId('value')).toHaveTextContent('5');
    expect(screen.getByTestId('content')).toHaveTextContent('Child value: 50');

    await user.click(screen.getByTestId('increase'));
    expect(screen.getByTestId('value')).toHaveTextContent('6');
    expect(screen.getByTestId('content')).toHaveTextContent('Child value: 60');
  });

  it('should return HOC with applied ViewModel and injected values', async () => {
    const user = userEvent.setup();

    const EXTRA_VALUE_TOKEN = token<number>();

    const CounterViewModelWithInjections = declareViewModel()
      .extend(withInjections({ extraValue: EXTRA_VALUE_TOKEN }))
      .apply<CounterViewModelType>(({ scope, view, deps }) => {
        const { initialValue } = view.props;
        const { extraValue } = deps;

        const store = scope.add(new CounterStore(initialValue() + extraValue));

        return {
          state: { value: store.asReadonly() },

          increase: store.updates.increase,
          decrease: store.updates.decrease,
        };
      });

    const CounterComponent = withViewModel(
      CounterView,
      CounterViewModelWithInjections,
    );

    const container = createContainer();
    container.bindValue(EXTRA_VALUE_TOKEN, 3);

    render(
      <DitoxNrgyReactExtension>
        <CustomDependencyContainer container={container}>
          <CounterComponent initialValue={5} label="TestLabel">
            <span>inner-content</span>
          </CounterComponent>
        </CustomDependencyContainer>
      </DitoxNrgyReactExtension>,
    );

    expect(screen.getByTestId('label')).toHaveTextContent('TestLabel');
    expect(screen.getByTestId('value')).toHaveTextContent('8');
    expect(screen.getByTestId('content')).toHaveTextContent('inner-content');

    await user.click(screen.getByTestId('increase'));
    expect(screen.getByTestId('value')).toHaveTextContent('9');

    await user.click(screen.getByTestId('decrease'));
    await user.click(screen.getByTestId('decrease'));
    expect(screen.getByTestId('value')).toHaveTextContent('7');
  });
});
