import { map } from 'rxjs/operators';

import { signal } from '../core/signal';
import { collectChanges, flushMicrotasks } from '../test/testUtils';

import { pipeSignal } from './pipeSignal';

describe('pipeSignal()', () => {
  it('should creates a transformed view of the source store', async () => {
    const source = signal(1);

    const result = pipeSignal(
      source,
      map((value) => value * 10),
    );
    await flushMicrotasks();

    expect(result()).toBe(10);

    source.set(2);
    await flushMicrotasks();

    expect(result()).toBe(20);
  });

  it('should unsubscribe the view when the source store is destroyed', async () => {
    const source = signal(1);

    const result = pipeSignal(
      source,
      map((value) => value * 10),
    );

    const history = await collectChanges(result, async () => {
      source.destroy();
      source.set(2);
      await flushMicrotasks();
      expect(result()).toBe(10);
    });

    expect(history).toEqual([1, 10]);
  });

  it('should creates a debounced view of the source store', async () => {
    const source = signal(1);

    const result = pipeSignal(source, (state$) =>
      state$.pipe(map((value) => value * 10)),
    );

    expect(result()).toBe(1);

    await flushMicrotasks();
    expect(result()).toBe(10);

    source.set(2);
    expect(result()).toBe(10);

    await flushMicrotasks();
    expect(result()).toBe(20);
  });
});
