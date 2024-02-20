import { flushMicrotasks } from '../test/testUtils';

import { atom } from './atom';
import { compute } from './compute';
import {
  effect,
  isForcedSyncSource,
  selectScheduler,
  syncEffect,
} from './effect';
import { ENERGY_RUNTIME } from './runtime';
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

  it('should be destroyed when a source atom is destroyed', async () => {
    const source = atom(1);
    const fx = effect(source, (value) => value * value);

    const onResult = jest.fn();
    const syncOnDestroy = jest.fn();
    const asyncOnDestroy = jest.fn();

    effect(fx.onResult, onResult);
    syncEffect(fx.onDestroy, syncOnDestroy);
    effect(fx.onDestroy, asyncOnDestroy);

    await flushMicrotasks();

    expect(onResult).toHaveBeenLastCalledWith(1);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncOnDestroy).toHaveBeenCalledTimes(0);
    expect(asyncOnDestroy).toHaveBeenCalledTimes(0);

    source.destroy();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(syncOnDestroy).toHaveBeenCalledTimes(1);

    // onDestory is a signal which is forced to be synchronous
    expect(asyncOnDestroy).toHaveBeenCalledTimes(1);
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

describe('isForcedSyncSource()', () => {
  it('should return true if the source is a signal with forced "sync" option', () => {
    expect(isForcedSyncSource(signal({ sync: true }))).toBe(true);
    expect(isForcedSyncSource(signal({ sync: false }))).toBe(false);
    expect(isForcedSyncSource(signal())).toBe(false);
    expect(isForcedSyncSource('some value')).toBe(false);
  });
});

describe('selectScheduler()', () => {
  it('should return a scheduler specified by the options', () => {
    const scheduler1 = selectScheduler(signal(), {
      scheduler: ENERGY_RUNTIME.syncScheduler,
    });
    expect(scheduler1).toBe(ENERGY_RUNTIME.syncScheduler);

    const scheduler2 = selectScheduler(signal(), {
      scheduler: ENERGY_RUNTIME.asyncScheduler,
    });
    expect(scheduler2).toBe(ENERGY_RUNTIME.asyncScheduler);
  });

  it('should return a scheduler specified by the "sync" option', () => {
    const scheduler1 = selectScheduler(signal(), {
      sync: true,
    });
    expect(scheduler1).toBe(ENERGY_RUNTIME.syncScheduler);

    const scheduler2 = selectScheduler(signal(), undefined);
    expect(scheduler2).toBe(ENERGY_RUNTIME.asyncScheduler);
  });

  it('should return a scheduler specified by the "sync" option of the signal', () => {
    expect(selectScheduler(atom(1), undefined)).toBe(
      ENERGY_RUNTIME.asyncScheduler,
    );

    expect(selectScheduler(signal(), undefined)).toBe(
      ENERGY_RUNTIME.asyncScheduler,
    );

    expect(selectScheduler(signal({ sync: true }), undefined)).toBe(
      ENERGY_RUNTIME.syncScheduler,
    );
  });
});
