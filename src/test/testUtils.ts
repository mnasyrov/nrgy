import { Signal } from '../core';
import { createScope } from '../core/scope';
import { createLatch } from '../core/utils';

export function flushMicrotasks(interval = 0): Promise<void> {
  const { promise, resolve } = createLatch();

  setTimeout(resolve, interval);

  return promise;
}

type HistoryEvent<T> =
  | { type: 'value'; value: T }
  | { type: 'error'; error: unknown };

export function collectHistory<T>(
  source: Signal<T>,
  action: () => void | Promise<void>,
  timeout = 500,
): Promise<Array<HistoryEvent<T>>> {
  const { promise, resolve, reject } = createLatch<HistoryEvent<T>[]>();

  const history: HistoryEvent<T>[] = [];
  const scope = createScope();
  scope.effect(
    source,
    (value) => history.push({ type: 'value', value }),
    (error) => history.push({ type: 'error', error }),
  );

  const timeoutId = setTimeout(() => {
    reject(new Error('Timeout is occurred'));
  }, timeout);

  setTimeout(async () => {
    try {
      await action();
      await flushMicrotasks();

      resolve(history);
    } catch (error) {
      reject(error);
    }
  });

  return promise.finally(() => {
    clearTimeout(timeoutId);
    scope.destroy();
  });
}

export async function collectChanges<T>(
  source: Signal<T>,
  action: () => void | Promise<void>,
  timeout = 500,
): Promise<Array<T>> {
  const history = await collectHistory(source, action, timeout);

  return history.map((event) => {
    if (event.type === 'error') throw event.error;

    return event.value;
  });
}