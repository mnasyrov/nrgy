import { collectChanges, flushMicrotasks } from '../../test/testUtils';
import { compute } from '../atoms/compute';
import { atom } from '../atoms/writableAtom';
import { effect } from '../effects/effect';
import { objectEquals } from '../utils/objectEquals';

import {
  createStore,
  createStoreUpdates,
  declareStateUpdates,
  StateUpdates,
} from './store';

describe('Concurrent Store updates', () => {
  it('should update the store and apply derived updates until completing the current one', async () => {
    const store = atom<{
      v1: string;
      v2: string;
      merged?: string;
      uppercase?: string;
    }>({ v1: 'a', v2: 'b' });

    const v1 = compute(() => store().v1);
    const v2 = compute(() => store().v2);

    const merged = compute(() => v1() + v2());

    const uppercase = compute(() => merged().toUpperCase());

    const history: any[] = [];
    effect(store, (value) => {
      history.push(value);
    });

    effect(merged, (merged) => {
      store.update((state) => ({ ...state, merged }));
    });

    effect(uppercase, (uppercase) => {
      store.update((state) => ({ ...state, uppercase }));
    });

    await flushMicrotasks();

    expect(store().merged).toEqual('ab');
    expect(store().uppercase).toEqual('AB');

    store.update((state) => ({ ...state, v1: 'c' }));
    store.update((state) => ({ ...state, v2: 'd' }));

    expect(store().merged).toEqual('ab');
    expect(store().uppercase).toEqual('AB');

    await flushMicrotasks();

    expect(store().merged).toEqual('cd');
    expect(store().uppercase).toEqual('CD');

    await flushMicrotasks();

    expect(history).toEqual([
      { v1: 'a', v2: 'b' },
      { v1: 'a', v2: 'b', merged: 'ab', uppercase: 'AB' },
      { v1: 'c', v2: 'd', merged: 'ab', uppercase: 'AB' },
      { v1: 'c', v2: 'd', merged: 'cd', uppercase: 'CD' },
    ]);
  });

  it('should trigger a listener in case a state was changed', async () => {
    const store = atom<{
      bar: number;
      foo: number;
    }>({ bar: 0, foo: 0 }, { equal: objectEquals });

    const history = await collectChanges(store, () => {
      store.update((state) => ({ ...state, foo: 1 }));
      store.update((state) => ({ ...state, foo: 2 }));
      store.update((state) => ({ ...state, bar: 42 }));
      store.update((state) => ({ ...state, foo: 2 }));
      store.update((state) => ({ ...state, foo: 3 }));
    });

    expect(history).toEqual([
      { bar: 0, foo: 0 },
      { bar: 42, foo: 3 },
    ]);
  });

  it('should preserve order of pending updates during applying the current update', async () => {
    const store = atom<{
      x: number;
      y: number;
      z: number;
    }>({ x: 0, y: 0, z: 0 }, { equal: objectEquals });

    effect(store, ({ x }) => store.update((state) => ({ ...state, y: x })));
    effect(store, ({ y }) => store.update((state) => ({ ...state, z: y })));

    const history = await collectChanges(store, () => {
      store.update((state) => ({ ...state, x: 1 }));
      store.update((state) => ({ ...state, x: 2 }));
      store.update((state) => ({ ...state, x: 3 }));
    });

    expect(history).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 3, z: 3 },
    ]);
  });

  it('should reschedule continuous setting a state by subscribers', async () => {
    const store = atom<number>(0);

    effect(store, (x) => {
      if (x < 100) {
        store.set(x * 10);
      }
    });

    const changes = await collectChanges(store, () => {
      store.set(1);
      store.set(2);
      store.set(3);
    });

    await flushMicrotasks();

    expect(changes).toEqual([0, 30, 300]);
  });
});

describe('createStoreUpdates()', () => {
  it('should provide actions to change a state of a store', () => {
    const store = atom(1);

    const updates = createStoreUpdates(store.update, {
      add: (value: number) => (state) => state + value,
      multiply: (value: number) => (state) => state * value,
    });

    updates.add(2);
    expect(store()).toBe(3);

    updates.multiply(3);
    expect(store()).toBe(9);
  });
});

describe('createStore()', () => {
  it('should use return a proxy for the store which is enhanced by update actions', () => {
    const store = createStore(1, {
      updates: {
        add: (value: number) => (state) => state + value,
        multiply: (value: number) => (state) => state * value,
      },
    });

    store.updates.add(2);
    expect(store()).toBe(3);

    store.updates.multiply(3);
    expect(store()).toBe(9);
  });

  it('should use a declared state mutations', () => {
    const updates: StateUpdates<number> = {
      add: (value: number) => (state) => state + value,
      multiply: (value: number) => (state) => state * value,
    };

    const store = createStore(1, { updates });

    store.updates.add(2);
    expect(store()).toBe(3);

    store.updates.multiply(3);
    expect(store()).toBe(9);
  });
});

describe('declareStateUpdates()', () => {
  it('should declare a record of state mutations #1', () => {
    const stateUpdates = declareStateUpdates<number>()({
      add: (value: number) => (state) => state + value,
      multiply: (value: number) => (state) => state * value,
    });

    const value = atom<number>(1);
    const updates = createStoreUpdates(value.update, stateUpdates);

    updates.add(2);
    updates.multiply(4);
    expect(value()).toBe(12);
  });

  it('should declare a record of state mutations #2', () => {
    const stateUpdates = declareStateUpdates(0, {
      add: (value: number) => (state) => state + value,
      multiply: (value: number) => (state) => state * value,
    });

    const value = atom<number>(1);
    const updates = createStoreUpdates(value.update, stateUpdates);

    updates.add(2);
    updates.multiply(4);
    expect(value()).toBe(12);
  });
});
