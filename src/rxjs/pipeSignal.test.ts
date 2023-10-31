import { map } from 'rxjs/operators';

import { atom } from '../core/atom';
import { collectChanges, flushMicrotasks } from '../test/testUtils';

import { pipeAtom } from './pipeAtom';

describe('pipeAtom()', () => {
  it('should creates a transformed view of the source atom', async () => {
    const source = atom(1);

    const result = pipeAtom(
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
    const source = atom(1);

    const result = pipeAtom(
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
    const source = atom(1);

    const result = pipeAtom(source, (state$) =>
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
