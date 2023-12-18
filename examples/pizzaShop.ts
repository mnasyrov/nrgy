import { delay, firstValueFrom, of } from 'rxjs';

import { Atom, compute, createScope, signal } from '../src/core';
import {
  futureOperation,
  FutureResult,
} from '../src/core/futures/futureOperation';
import { Controller } from '../src/core/mvc';
import { declareStore } from '../src/core/store';

// The state and a factory for the store
type CartState = Readonly<{ orders: Array<string> }>;

const createCartStore = declareStore<CartState>({
  initialState: { orders: [] },
  updates: {
    addPizza: (name: string) => (state) => ({
      ...state,
      orders: [...state.orders, name],
    }),

    removePizza: (name: string) => (state) => ({
      ...state,
      orders: state.orders.filter((order) => order !== name),
    }),
  },
});

// Declaring the controller.
// It should provide methods for triggering the actions,
// and queries or observables for subscribing to data.
export type PizzaShopController = Controller<{
  getOrders: Atom<Array<string>>;

  addPizza: (name: string) => void;
  removePizza: (name: string) => void;
  submitCart: () => Atom<FutureResult<Array<string>>>;
}>;

export function createPizzaShopController(): PizzaShopController {
  // Creates the scope to track subscriptions
  const scope = createScope();

  // Creates the store
  const store = scope.add(createCartStore());

  // Creates queries for the state data
  const getOrders = compute(() => store().orders);

  // Introduces actions
  const addPizza = signal<string>();
  const removePizza = signal<string>();

  // Handle simple actions
  scope.effect(addPizza, (order) => store.updates.addPizzaToCart(order));
  scope.effect(removePizza, (name) => store.updates.removePizzaFromCart(name));

  const submitCart = futureOperation<void, Array<string>>(() => {
    const orders = getOrders();
    return firstValueFrom(of(orders).pipe(delay(1000)));
  });

  return {
    getOrders,
    addPizza,
    removePizza,
    submitCart,
    destroy: () => scope.destroy(),
  };
}
