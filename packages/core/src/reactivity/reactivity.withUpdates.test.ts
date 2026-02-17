import { describe, expect, it } from 'vitest';
import { atom } from './reactivity';

describe('SourceAtom.withUpdates()', () => {
  it('should add updates to the atom', () => {
    const initialAtom = atom(0);
    expect((initialAtom as any).updates).not.toBeDefined();

    const store = initialAtom.withUpdates({
      add: (val: number, atomValue: number) => atomValue + val,
      toDefault: () => 0,
    });

    expect((initialAtom as any).updates).not.toBeDefined();

    expect(store.updates).toBeDefined();
    expect(typeof store.updates.add).toBe('function');
    expect(typeof store.updates.toDefault).toBe('function');

    store.updates.add(1);
    expect(store()).toBe(1);

    store.updates.add(5);
    expect(store()).toBe(6);

    store.updates.toDefault();
    expect(store()).toBe(0);
  });

  it('should allow updates to use current atom value', () => {
    const store = atom({ count: 1 }).withUpdates({
      double: (state) => ({ count: state.count * 2 }),
      increment: (state, by: number) => ({ count: state.count + by }),
      addTwoValues: (state, a: number, b: number) => ({
        count: state.count + a + b,
      }),
    });

    store.updates.double();
    expect(store()).toEqual({ count: 2 });

    store.updates.increment(3);
    expect(store()).toEqual({ count: 5 });

    store.updates.addTwoValues(4, 5);
    expect(store()).toEqual({ count: 14 });
  });

  it('should support updates without arguments', () => {
    const store = atom(10).withUpdates({
      reset: () => 0,
      increment: (value) => value + 1,
    });

    store.updates.increment();
    expect(store()).toBe(11);

    store.updates.reset();
    expect(store()).toBe(0);
  });
});
