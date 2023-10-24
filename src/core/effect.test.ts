import { waitForMicrotask } from '../test/testUtils';

import { action } from './action';
import { compute } from './compute';
import { effect, effectSync } from './effect';
import { signal } from './signal';

describe('effect()', () => {
  it('should subscribe to an action', async () => {
    const emitter = action<number>();

    let result = 0;
    const fx = effect(emitter, (value) => (result = value));

    await waitForMicrotask();
    expect(result).toBe(0);

    emitter(1);
    await waitForMicrotask();
    expect(result).toBe(1);

    fx.destroy();
    emitter(2);
    await waitForMicrotask();
    expect(result).toBe(1);
  });

  it('should subscribe to a signal', async () => {
    const a = signal(1);
    const b = signal(2);

    let result = 0;
    const fx = effect(
      compute(() => a() + b()),
      (value) => (result = value),
    );

    await waitForMicrotask();
    expect(result).toBe(3);

    a.set(2);
    await waitForMicrotask();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    await waitForMicrotask();
    expect(result).toBe(4);
  });

  it('should handle a computing function', async () => {
    const a = signal(1);
    const b = signal(2);

    let result = 0;
    const fx = effect(() => (result = a() + b()));

    await waitForMicrotask();
    expect(result).toBe(3);

    a.set(2);
    await waitForMicrotask();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    await waitForMicrotask();
    expect(result).toBe(4);
  });

  it('should not lost its subscription context', async () => {
    const a = signal(0);

    const results: number[] = [];
    effect(() => results.push(a()));
    await waitForMicrotask();

    a.set(1);
    a.set(2);
    await waitForMicrotask();
    expect(results).toEqual([0, 2]);

    a.set(3);
    a.set(4);
    expect(a()).toEqual(4);

    await waitForMicrotask();
    expect(results).toEqual([0, 2, 4]);
  });
});

describe('effectSync()', () => {
  it('should subscribe to an action', () => {
    const emitter = action<number>();

    let result = 0;
    const fx = effectSync(emitter, (value) => (result = value));
    expect(result).toBe(0);

    emitter(1);
    expect(result).toBe(1);

    fx.destroy();
    emitter(2);
    expect(result).toBe(1);
  });

  it('should subscribe to a signal', () => {
    const a = signal(1);
    const b = signal(2);

    let result = 0;
    const fx = effectSync(
      compute(() => a() + b()),
      (value) => (result = value),
    );
    expect(result).toBe(3);

    a.set(2);
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    expect(result).toBe(4);
  });

  it('should handle a computing function', () => {
    const a = signal(1);
    const b = signal(2);

    let result = 0;
    const fx = effectSync(() => (result = a() + b()));
    expect(result).toBe(3);

    a.set(2);
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    expect(result).toBe(4);
  });
});
