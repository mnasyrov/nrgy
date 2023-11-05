import { flushMicrotasks } from '../test/testUtils';

import { atom } from './atom';
import { compute } from './compute';
import { effect, syncEffect } from './effect';
import { signal } from './signal';

describe('effect()', () => {
  it('should subscribe to a signal', async () => {
    const emitter = signal<number>();

    let result = 0;
    const fx = effect(emitter, (value) => (result = value));

    await flushMicrotasks();
    expect(result).toBe(0);

    emitter(1);
    await flushMicrotasks();
    expect(result).toBe(1);

    fx.destroy();
    emitter(2);
    await flushMicrotasks();
    expect(result).toBe(1);
  });

  it('should subscribe to an atom', async () => {
    const a = atom(1);

    let result = 0;
    const fx = effect(a, (value) => (result = value));
    await flushMicrotasks();
    expect(result).toBe(1);

    a.set(2);
    await flushMicrotasks();
    expect(result).toBe(2);

    fx.destroy();
    a.set(3);
    await flushMicrotasks();
    expect(result).toBe(2);
  });

  it('should subscribe to a compute', async () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = effect(
      compute(() => a() + b()),
      (value) => (result = value),
    );

    await flushMicrotasks();
    expect(result).toBe(3);

    a.set(2);
    await flushMicrotasks();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    await flushMicrotasks();
    expect(result).toBe(4);
  });

  it('should handle a computing function', async () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = effect(() => (result = a() + b()));

    await flushMicrotasks();
    expect(result).toBe(3);

    a.set(2);
    await flushMicrotasks();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    await flushMicrotasks();
    expect(result).toBe(4);
  });

  it('should not lost its subscription context', async () => {
    const a = atom(0);

    const results: number[] = [];
    effect(() => results.push(a()));
    await flushMicrotasks();

    a.set(1);
    a.set(2);
    await flushMicrotasks();
    expect(results).toEqual([0, 2]);

    a.set(3);
    a.set(4);
    expect(a()).toEqual(4);

    await flushMicrotasks();
    expect(results).toEqual([0, 2, 4]);
  });
});

describe('syncEffect()', () => {
  it('should subscribe to a signal', () => {
    const emitter = signal<number>();

    let result = 0;
    const fx = syncEffect(emitter, (value) => (result = value));
    expect(result).toBe(0);

    emitter(1);
    expect(result).toBe(1);

    fx.destroy();
    emitter(2);
    expect(result).toBe(1);
  });

  it('should subscribe to an atom', () => {
    const a = atom(1);

    let result = 0;
    const fx = syncEffect(a, (value) => (result = value));
    expect(result).toBe(1);

    a.set(2);
    expect(result).toBe(2);

    fx.destroy();
    a.set(3);
    expect(result).toBe(2);
  });

  it('should subscribe to a compute', () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = syncEffect(
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
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = syncEffect(() => (result = a() + b()));
    expect(result).toBe(3);

    a.set(2);
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    expect(result).toBe(4);
  });
});
