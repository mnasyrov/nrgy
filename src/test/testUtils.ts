import { defer, finalize, MonoTypeOperatorFunction, noop } from 'rxjs';

import { Atom, createScope } from '../core';
import { createLatch } from '../core/internals/latch';

export function promiseTimeout(interval: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, interval));
}

export function flushMicrotasks(interval = 0): Promise<void> {
  return promiseTimeout(interval);
}

type HistoryEvent<T> =
  | { type: 'value'; value: T }
  | { type: 'error'; error: unknown };

export function collectHistory<T>(
  source: Atom<T>,
  action: () => void | Promise<void>,
  timeout = 500,
): Promise<Array<HistoryEvent<T>>> {
  const { promise, resolve, reject } = createLatch<HistoryEvent<T>[]>();

  const history: HistoryEvent<T>[] = [];
  const scope = createScope();

  const fx = scope.effect(source, (value) =>
    history.push({ type: 'value', value }),
  );
  scope.effect(fx.onError, (error) => history.push({ type: 'error', error }));
  scope.effect(fx.onDestroy, () => scope.destroy());

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
  source: Atom<T>,
  action: () => void | Promise<void>,
  timeout = 500,
): Promise<Array<T>> {
  const history = await collectHistory(source, action, timeout);

  return history.map((event) => {
    if (event.type === 'error') throw event.error;

    return event.value;
  });
}

export function monitorSubscriptionCount<T>(
  onCountUpdate: (count: number) => void = noop,
): MonoTypeOperatorFunction<T> {
  return (source$) => {
    let counter = 0;

    return defer(() => {
      counter += 1;
      onCountUpdate(counter);
      return source$;
    }).pipe(
      finalize(() => {
        counter -= 1;
        onCountUpdate(counter);
      }),
    );
  };
}
