import { Atom, createScope } from '../core';
import { createLatch } from '../core/internals/latch';

import { flushMicrotasks } from './flushMicrotasks';

export async function collectAtomChanges<T>(
  source: Atom<T>,
  action: () => void | Promise<void>,
  timeout = 500,
): Promise<Array<T>> {
  type HistoryEvent<T> =
    | { type: 'value'; value: T }
    | { type: 'error'; error: unknown };

  const { promise, resolve, reject } = createLatch<HistoryEvent<T>[]>();

  const historyEvents: HistoryEvent<T>[] = [];
  const scope = createScope();

  scope.effect(
    source,
    (value) => historyEvents.push({ type: 'value', value }),
    {
      onError: (error) => historyEvents.push({ type: 'error', error }),
      onDestroy: () => scope.destroy(),
    },
  );

  const timeoutId = setTimeout(() => {
    reject(new Error('Timeout is occurred'));
  }, timeout);

  setTimeout(async () => {
    try {
      await action();
      await flushMicrotasks();

      resolve(historyEvents);
    } catch (error) {
      reject(error);
    }
  });

  const history = await promise.finally(() => {
    clearTimeout(timeoutId);
    scope.destroy();
  });

  return history.map((event) => {
    if (event.type === 'error') throw event.error;

    return event.value;
  });
}
