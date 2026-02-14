import {
  type Atom,
  declareController,
  readonlyAtom,
  withView,
} from '@nrgyjs/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type FC } from 'react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';

import { useAtom } from './useAtom';
import { withViewController } from './withViewController';

describe('withViewController()', () => {
  type BaseCounterController = {
    $value: Atom<number>;
    increase(): void;
    decrease(): void;
  };

  const CounterView: FC<{
    controller: BaseCounterController;
    initialValue: number;
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
        <button data-testid="decrease" onClick={decrease} />
      </>
    );
  };

  const CounterController = declareController()
    .extend(withView<{ initialValue: number; label: string }>())
    .apply<BaseCounterController>(({ scope, view }) => {
      const { initialValue, label } = view.props;

      const $value = scope.atom(initialValue());

      function update(delta: number) {
        $value.update((prev) => prev + delta);
      }

      return {
        props: { label },

        $value: readonlyAtom($value),

        increase: () => update(1),
        decrease: () => update(-1),
      };
    });

  it('should return HOC with applied controller', async () => {
    const user = userEvent.setup();

    const TestCounter = withViewController(CounterController)(CounterView);

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
