import React, { FC, useEffect } from 'react';

import { useConst, useObservable, useQuery } from '../src/react/_public';

import { createPizzaShopController } from './pizzaShop';

export const PizzaShopComponent: FC = () => {
  // Creates the controller and destroy it on unmounting the component
  const controller = useConst(() => createPizzaShopController());
  useEffect(() => controller.destroy, [controller]);

  // The same creation can be achieved by using `useController()` helper:
  // const controller = useController(createPizzaShopController);

  // Using the controller
  const { orders, addPizza, removePizza, submitCart, submitState } = controller;

  // Subscribing to state data and the effect stata
  const orders = useQuery(orders);
  const isPending = useQuery(submitState.pending);
  const submitError = useObservable(submitState.error$, undefined);

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
        {orders.map((name) => (
          <li>
            {name}
            <button disabled={isPending} onClick={() => removePizza(name)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button disabled={isPending || orders.length === 0} onClick={submitCart}>
        Submit
      </button>

      {submitError && <div>Failed to submit the cart</div>}
    </>
  );
};
