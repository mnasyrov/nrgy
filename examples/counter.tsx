import React, { FC } from 'react';

import { declareStateUpdates } from '../src/rx-effects/_public';
import { useStore } from '../src-temp/react';

const COUNTER_STATE = 0;

const COUNTER_UPDATES = declareStateUpdates<number>()({
  decrement: () => (state) => state - 1,
  increment: () => (state) => state + 1,
});

export const App: FC = () => {
  const [counter, counterUpdates] = useStore(COUNTER_STATE, COUNTER_UPDATES);

  return (
    <div>
      <button onClick={() => counterUpdates.decrement()}>-</button>
      <span>{counter}</span>
      <button onClick={() => counterUpdates.increment()}>+</button>
    </div>
  );
};
