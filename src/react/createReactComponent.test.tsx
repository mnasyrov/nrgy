import React, { FC } from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line import/no-named-as-default
import userEvent from '@testing-library/user-event';

import { Atom } from '../core';
import { declareController, viewProps, withView } from '../core/mvc';

import { createReactComponent } from './createReactComponent';
import { useAtom } from './useAtom';

describe('ViewController HOC', () => {
  type BaseCounterController = {
    $value: Atom<number>;
    increase(): void;
    decrease(): void;
  };

  const CounterView: FC<{
    controller: BaseCounterController;
    label: string;
  }> = (props) => {
    const { controller, label } = props;
    const { $value, increase, decrease } = controller;

    const value = useAtom($value);

    return (
      <>
        <span data-testid="label">{label}</span>
        <span data-testid="value">{value}</span>
        <button data-testid="increase" onClick={increase} />
        <button data-testid="descrease" onClick={decrease} />
      </>
    );
  };

  const CounterController = declareController
    .extend(withView(viewProps<{ initialValue: number }>()))
    .apply(({ scope, view }) => {
      const { initialValue } = view.props;

      const $value = scope.atom(initialValue());

      function update(delta: number) {
        $value.update((prev) => prev + delta);
      }

      return {
        $value: $value.asReadonly(),
        increase: () => update(1),
        decrease: () => update(-1),
      };
    });

  it('should combine a view controller and a react component to HOC component', async () => {
    const user = userEvent.setup();

    const TestCounter = createReactComponent(CounterController, CounterView);

    render(<TestCounter initialValue={5} label="TestLabel" />);

    expect(screen.getByTestId('label')).toHaveTextContent('TestLabel');
    expect(screen.getByTestId('value')).toHaveTextContent('5');

    await user.click(screen.getByTestId('increase'));
    expect(screen.getByTestId('value')).toHaveTextContent('6');

    await user.click(screen.getByTestId('descrease'));
    await user.click(screen.getByTestId('descrease'));
    expect(screen.getByTestId('value')).toHaveTextContent('4');
  });
});
