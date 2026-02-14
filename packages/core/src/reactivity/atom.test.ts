import { describe, expect, it, vi } from 'vitest';
import { runEffects } from '../utils/runEffects';

import { atom, effect, syncEffect } from './reactivity';
import { type SourceAtom } from './types';

describe('atom()', () => {
  it('should create a value store with the provided initial state', () => {
    const store = atom(1);

    expect(store).toBeInstanceOf(Function);

    expect(store).toEqual(
      expect.objectContaining({
        set: expect.any(Function),
        update: expect.any(Function),
        mutate: expect.any(Function),
        destroy: expect.any(Function),
      }),
    );

    expect(store()).toEqual(1);
  });
});

describe('WritableAtom', () => {
  describe('getter', () => {
    it('should return a current state of the store', () => {
      const store = atom(1);
      expect(store()).toEqual(1);
    });
  });

  describe('set()', () => {
    it('should set a new state to the store', () => {
      const store = atom({ value: 1 });
      store.set({ value: 2 });
      expect(store()).toEqual({ value: 2 });

      // Do not update the destroyed atom
      store.destroy();
      store.set({ value: 3 });
      expect(store()).toEqual({ value: 2 });
    });

    it('must use a custom comparator', async () => {
      const store = atom(
        { value: 1, data: 'a' },
        { equal: (s1, s2) => s1.value === s2.value },
      );

      const changes: any[] = [];
      effect(store, (state) => changes.push(state));
      runEffects();

      store.set({ value: 1, data: 'b' });
      expect(store()).toEqual({ value: 1, data: 'a' });

      store.set({ value: 2, data: 'c' });
      expect(store()).toEqual({ value: 2, data: 'c' });

      runEffects();

      expect(changes).toEqual([
        { value: 1, data: 'a' },
        { value: 2, data: 'c' },
      ]);
    });

    it('should not notify destroyed effect', () => {
      const onChange = vi.fn();

      const store = atom<number>(1);
      const fx = syncEffect(store, onChange);

      onChange.mockClear();
      store.set(2);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(2);

      onChange.mockClear();
      fx.destroy();
      store.set(3);
      expect(onChange).toHaveBeenCalledTimes(0);
    });
  });

  describe('update()', () => {
    it('should apply a mutation to the store', () => {
      const store = atom({ value: 1 });
      store.update((state) => ({ value: state.value + 10 }));
      expect(store()).toEqual({ value: 11 });
    });

    it('should not apply a mutation if the new state is the same', async () => {
      const store = atom({ value: 1 });

      const changes: any[] = [];
      effect(store, (state) => changes.push(state));

      store.update((state) => state);
      runEffects();

      expect(changes).toEqual([{ value: 1 }]);
    });
  });

  describe('mutate()', () => {
    it('should provide the current value to the mutator function and trigger "has changed" flow without any equality checks', () => {
      const store = atom({ value: 1 });

      const collectedValues: number[] = [];
      syncEffect(store, (state) => collectedValues.push(state.value));

      store.mutate((state) => (state.value = 2));
      store.mutate((state) => (state.value = 3));
      store.mutate(() => {
        // Do nothing
      });

      // Do not mutate destroyed atom
      store.destroy();
      store.mutate((state) => (state.value = 4));

      expect(collectedValues).toEqual([1, 2, 3, 3]);
    });
  });

  describe('destroy()', () => {
    it('should complete an internal store', async () => {
      const changes: number[] = [];
      const store = atom<number>(1);

      effect(store, (value) => changes.push(value));
      runEffects();

      store.set(2);
      runEffects();

      store.set(3);
      store.destroy();
      store.set(4);
      runEffects();

      expect(changes).toEqual([1, 2, 3]);
    });

    it('should call `onDestroy` callback', async () => {
      const onDestroy = vi.fn();
      const store = atom<number>(1, { onDestroy });

      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);

      // It should destroy once if called twice
      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });

    it('should allow `onDestroy` callback to change its value', async () => {
      const store: SourceAtom<number> = atom<number>(1, {
        onDestroy: () => store.set(0),
      });

      expect(store()).toBe(1);

      store.destroy();
      expect(store()).toBe(0);
    });

    it('should not notify destroyed effects', () => {
      const store = atom<number>(1);

      const onDestroy = vi.fn();
      const fx = syncEffect(store, () => {}, { onDestroy });

      store.set(2);
      fx.destroy();

      expect(onDestroy).toHaveBeenCalledTimes(1);

      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);

      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});
