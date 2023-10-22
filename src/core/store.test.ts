import { firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';

import { collectChanges } from '../../test/testUtils';
import { toObservable } from '../rxjs';

import { objectEquals } from './common';
import { computed } from './computed';
import { signal } from './signal';
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

    const value = signal({ value: 0 });
    value.update(composedMutation);
    expect(value()).toBe(22);
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
      const store = createStore<State>({ value: 1 }, {});
      expect(store()).toBe(1);
    });

    it('should use a custom comparator', async () => {
      const store = signal<State>(
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
      const store = signal<State>({ value: 1 });
      expect(store()).toEqual({ value: 1 });
    });
  });

  describe('set()', () => {
    it('should set a new state to the store', () => {
      const store = signal<State>({ value: 1 });
      store.set({ value: 2 });
      expect(store()).toEqual({ value: 2 });
    });
  });

  describe('update()', () => {
    it('should apply a mutation to the store', () => {
      const store = signal<State>({ value: 1 });
      store.update((state) => ({ value: state.value + 10 }));
      expect(store()).toEqual({ value: 11 });
    });

    it('should not apply a mutation if the new state is the same', async () => {
      const store = signal<State>({ value: 1 });

      const statePromise = firstValueFrom(toObservable(store).pipe(toArray()));
      store.update((state) => state);
      store.destroy();

      expect(await statePromise).toEqual([{ value: 1 }]);
    });
  });

  describe('destroy()', () => {
    it('should complete an internal store', async () => {
      const store = signal<number>(1);

      const changes = await collectChanges(store, () => {
        store.set(2);
        store.destroy();
        store.set(3);
      });

      expect(changes).toEqual([1]);
    });

    it('should call `onDestroy` callback', async () => {
      const onDestroy = jest.fn();
      const store = createStore<number>(1, { onDestroy });

      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Concurrent Store updates', () => {
  it('should update the store and apply derived updates until completing the current one', async () => {
    const store = signal<{
      v1: string;
      v2: string;
      merged?: string;
      uppercase?: string;
    }>({ v1: 'a', v2: 'b' });

    const v1 = computed(() => store().v1);
    const v2 = computed(() => store().v2);

    const merged = computed(() => v1() + v2());

    const uppercase = computed(() => merged().toUpperCase());

    const history = await collectChanges(toObservable(store), async () => {
      toObservable(merged).subscribe((merged) =>
        store.update((state) => ({ ...state, merged })),
      );

      toObservable(uppercase).subscribe((uppercase) =>
        store.update((state) => ({ ...state, uppercase })),
      );

      await 0;

      expect(store().merged).toEqual('ab');
      expect(store().uppercase).toEqual('AB');

      store.update((state) => ({ ...state, v1: 'c' }));
      store.update((state) => ({ ...state, v2: 'd' }));

      expect(store().merged).toEqual('ab');
      expect(store().uppercase).toEqual('AB');

      await 0;

      expect(store().merged).toEqual('cd');
      expect(store().uppercase).toEqual('CD');
    });

    expect(history).toEqual([
      { v1: 'a', v2: 'b' },
      { v1: 'a', v2: 'b', merged: 'ab', uppercase: 'AB' },
      { v1: 'c', v2: 'd', merged: 'ab', uppercase: 'AB' },
      { v1: 'c', v2: 'd', merged: 'cd', uppercase: 'CD' },
    ]);
  });

  it('should trigger a listener in case a state was changed', async () => {
    const store = signal<{
      bar: number;
      foo: number;
    }>({ bar: 0, foo: 0 }, { equal: objectEquals });

    const history = await collectChanges(toObservable(store), () => {
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
    const store = signal<{
      x: number;
      y: number;
      z: number;
    }>({ x: 0, y: 0, z: 0 }, { equal: objectEquals });

    toObservable(store).subscribe(({ x }) =>
      store.update((state) => ({ ...state, y: x })),
    );
    toObservable(store).subscribe(({ y }) =>
      store.update((state) => ({ ...state, z: y })),
    );

    const history = await collectChanges(toObservable(store), () => {
      store.update((state) => ({ ...state, x: 1 }));
      store.update((state) => ({ ...state, x: 2 }));
      store.update((state) => ({ ...state, x: 3 }));
    });

    expect(history).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 3, y: 3, z: 3 },
    ]);
  });

  it('should reschedule continuous setting a state by subscribers', async () => {
    const store = signal<number>(0);

    toObservable(store).subscribe((x) => {
      if (x < 100) {
        store.set(x * 10);
      }
    });

    const changes = await collectChanges(toObservable(store), () => {
      store.set(1);
      store.set(2);
      store.set(3);
    });

    expect(changes).toEqual([0, 3, 30, 300]);
  });
});

describe('createSignalUpdates()', () => {
  it('should provide actions to change a state of a store', () => {
    const store = signal(1);

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
      add: (value: number) => (state) => state + value,
      multiply: (value: number) => (state) => state * value,
    });

    store.updates.add(2);
    expect(store()).toBe(3);

    store.updates.multiply(3);
    expect(store()).toBe(9);
  });

  it('should use a declared state mutations', () => {
    const stateUpdates: StateUpdates<number> = {
      add: (value: number) => (state) => state + value,
      multiply: (value: number) => (state) => state * value,
    };

    const store = createStore(1, stateUpdates);

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

    const value = signal<number>(1);
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

    const value = signal<number>(1);
    const updates = createStoreUpdates(value.update, stateUpdates);

    updates.add(2);
    updates.multiply(4);
    expect(value()).toBe(12);
  });
});
