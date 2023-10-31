import { atom } from '../core/atom';
import { objectEquals } from '../core/common';
import { compute } from '../core/compute';
import { effect } from '../core/effect';
import { observe } from '../rxjs/_public';
import { collectChanges, flushMicrotasks } from '../test/testUtils';

import {
  createStore,
  createStoreUpdates,
  declareStateUpdates,
  pipeStateMutations,
  StateMutation,
  StateUpdates,
} from './store';

describe('pipeStateMutations()', () => {
  type State = { value: number };

  it('should compose the provided mutations to a single mutation', () => {
    const composedMutation: StateMutation<State> = pipeStateMutations([
      () => ({ value: 10 }),
      (state) => ({ value: state.value + 1 }),
      (state) => ({ value: state.value * 2 }),
    ]);

    const value = atom({ value: 0 });
    value.update(composedMutation);
    expect(value()).toStrictEqual({ value: 22 });
  });
});

describe('Store', () => {
  type State = { value: number; data?: string };

  // const increment = (prev: { value: number }) => ({
  //   ...prev,
  //   value: prev.value + 1,
  // });

  describe('createStore()', () => {
    it('should create a store with the provided initial state', () => {
      const store = atom<State>({ value: 1 });
      expect(store()).toEqual({ value: 1 });
    });

    it('should use a custom comparator', async () => {
      const store = atom<State>(
        { value: 1, data: 'a' },
        { equal: (s1, s2) => s1.value === s2.value },
      );

      const changes = await collectChanges(store, () => {
        store.set({ value: 1, data: 'b' });
        store.set({ value: 2, data: 'c' });
      });

      expect(changes).toEqual([
        { value: 1, data: 'a' },
        { value: 2, data: 'c' },
      ]);
    });
  });

  describe('get()', () => {
    it('should return a current state of the store', () => {
      const store = atom<State>({ value: 1 });
      expect(store()).toEqual({ value: 1 });
    });
  });

  describe('set()', () => {
    it('should set a new state to the store', () => {
      const store = atom<State>({ value: 1 });
      store.set({ value: 2 });
      expect(store()).toEqual({ value: 2 });
    });
  });

  describe('update()', () => {
    it('should apply a mutation to the store', () => {
      const store = atom<State>({ value: 1 });
      store.update((state) => ({ value: state.value + 10 }));
      expect(store()).toEqual({ value: 11 });
    });

    it('should not apply a mutation if the new state is the same', async () => {
      const store = atom<State>({ value: 1 });

      const statePromise = collectChanges(store, () => {
        store.update((state) => state);
      });
      store.destroy();

      expect(await statePromise).toEqual([{ value: 1 }]);
    });
  });

  describe('destroy()', () => {
    it('should complete an internal store', async () => {
      const store = atom<number>(1);

      const changes = await collectChanges(store, () => {
        store.set(2);
        store.destroy();
        store.set(3);
      });

      expect(changes).toEqual([1, 2]);
    });

    it('should call `onDestroy` callback', async () => {
      const onDestroy = jest.fn();
      const store = atom<number>(1, { onDestroy });

      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});

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

    observe(store).subscribe((x) => {
      if (x < 100) {
        store.set(x * 10);
      }
    });

    const changes = await collectChanges(store, () => {
      store.set(1);
      store.set(2);
      store.set(3);
    });

    expect(changes).toEqual([0, 3, 30, 300]);
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
