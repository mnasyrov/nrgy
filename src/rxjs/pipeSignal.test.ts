import { materialize } from 'rxjs';
import { map } from 'rxjs/operators';

import { signal } from '../core';
import { collectChanges, waitForMicrotask } from '../test/testUtils';

import { pipeSignal } from './pipeSignal';
import { toObservable } from './toObservable';

describe('pipeSignal()', () => {
  it('should creates a transformed view of the source store', async () => {
    const source = signal(1);

    const result = pipeSignal(
      source,
      map((value) => value * 10),
    );
    await waitForMicrotask();

    expect(result()).toBe(10);

    source.set(2);
    await waitForMicrotask();

    expect(result()).toBe(20);
  });

  it('should unsubscribe the view when the source store is destroyed', async () => {
    const source = signal(1);

    const result = pipeSignal(
      source,
      map((value) => value * 10),
    );

    const notifications$ = toObservable(result).pipe(materialize());

    const notificationsPromise = collectChanges(notifications$, async () => {
      source.destroy();
      source.set(2);
      await waitForMicrotask();
      expect(result()).toBe(10);
    });

    expect(await notificationsPromise).toEqual([
      {
        hasValue: true,
        kind: 'N',
        value: 1,
      },
      {
        hasValue: true,
        kind: 'N',
        value: 10,
      },
    ]);
  });

  it('should creates a debounced view of the source store', async () => {
    const source = signal(1);

    const result = pipeSignal(source, (state$) =>
      state$.pipe(map((value) => value * 10)),
    );

    expect(result()).toBe(1);

    await waitForMicrotask();
    expect(result()).toBe(10);

    source.set(2);
    expect(result()).toBe(10);

    await waitForMicrotask();
    expect(result()).toBe(20);
  });
});
