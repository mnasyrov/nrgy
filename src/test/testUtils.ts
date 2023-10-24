import {
  bufferWhen,
  firstValueFrom,
  Observable,
  Subject,
  timeout,
  timer,
} from 'rxjs';

import { isSignal, Signal } from '../core';
import { createScope } from '../core/scope';
import { createLatch } from '../core/utils';
import { toObservable } from '../rxjs';

export function waitForMicrotask(interval = 0): Promise<void> {
  return firstValueFrom(timer(interval)).then(() => undefined);
}

export function collectChanges<T>(
  source: Signal<T>,
  action: () => void | Promise<void>,
  interval?: number,
): Promise<Array<T>>;

export function collectChanges<T>(
  source: Observable<T>,
  action: () => void | Promise<void>,
  interval?: number,
): Promise<Array<T>>;

export function collectChanges<T>(
  source: Signal<T> | Observable<T>,
  action: () => void | Promise<void>,
  interval = 500,
): Promise<Array<T>> {
  const bufferClose$ = new Subject<void>();

  const source$ = isSignal(source) ? toObservable(source) : source;

  const resultPromise = firstValueFrom(
    source$.pipe(
      timeout(interval),
      bufferWhen(() => bufferClose$),
    ),
  );

  setTimeout(async () => {
    await action();

    await waitForMicrotask();

    bufferClose$.next();
  });

  return resultPromise;
}

export function collectSignalChanges<T>(
  source: Signal<T>,
  action: () => void | Promise<void>,
  timeout = 500,
): Promise<Array<T>> {
  const { promise, resolve, reject } = createLatch<T[]>();

  const results: T[] = [];
  const scope = createScope();
  scope.effect(source, (value) => results.push(value));

  const timeoutId = setTimeout(() => {
    reject(new Error('Timeout is occurred'));
  }, timeout);

  setTimeout(async () => {
    try {
      await action();
      await waitForMicrotask();

      resolve(results);
    } catch (error) {
      reject(error);
    }
  });

  return promise.finally(() => {
    clearTimeout(timeoutId);
    scope.destroy();
  });
}
