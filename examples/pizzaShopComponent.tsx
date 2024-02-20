import { FC, useState } from 'react';

import {
  FUTURE_RESULT_INITIAL,
  FutureResult,
} from '../experiments/futures/futureOperation';
import { useAtom, useController } from '../src/react';

import { PizzaShopController } from './pizzaShop';

export const PizzaShopComponent: FC = () => {
  const controller = useController(PizzaShopController);

  // Using the controller
  const { orders, addPizza, removePizza, submitCart } = controller;

  // Subscribing to state data and the effect stata
  const ordersValue = useAtom(orders);
  const [submitState, setSubmitState] = useState<FutureResult<Array<string>>>(
    FUTURE_RESULT_INITIAL,
  );

  const isPending = submitState.type === 'initial';
  const isError = submitState.type === 'error';

  function submitForm() {
    const state = submitCart();
    setSubmitState(state);
  }

  return (
    <>
      <h1>Pizza Shop</h1>

      <h2>Menu</h2>
      <ul>
        <li>
          Pepperoni
          <button disabled={isPending} onClick={() => addPizza('Pepperoni')}>
            Add
          </button>
        </li>

        <li>
          Margherita
          <button disabled={isPending} onClick={() => addPizza('Margherita')}>
            Add
          </button>
        </li>
      </ul>

      <h2>Cart</h2>
      <ul>
        {ordersValue.map((name) => (
          <li>
            {name}
            <button disabled={isPending} onClick={() => removePizza(name)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        disabled={isPending || ordersValue.length === 0}
        onClick={submitForm}
      >
        Submit
      </button>

      {isError && <div>Failed to submit the cart</div>}
    </>
  );
};
