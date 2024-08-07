import React, { FC } from 'react';

import { declareStore } from '../src/core';
import { declareController } from '../src/mvc';
import { useController } from '../src/mvc-react';
import { useAtom } from '../src/react';

const CounterStore = declareStore({
  initialState: 0,
  updates: {
    increment: () => (state) => state + 1,
    decrement: () => (state) => state - 1,
  },
});

const CounterController = declareController(({ scope }) => {
  const store = scope.add(new CounterStore());

  return { value: store.asReadonly(), updates: store.updates };
});

export const App: FC = () => {
  const store = useController(CounterController);
  const value = useAtom(store.value);

  return (
    <div>
      <button onClick={() => store.updates.decrement()}>-</button>
      <span>{value}</span>
      <button onClick={() => store.updates.increment()}>+</button>
    </div>
  );
};
