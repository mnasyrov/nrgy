import { expectEffectContext } from '../../test/matchers';
import { collectChanges, flushMicrotasks } from '../../test/testUtils';
import { effect, syncEffect } from '../effects/effect';
import { getSignalNode } from '../signals/common';

import { isAtom, WritableAtom } from './atom';
import { atom } from './writableAtom';

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

      // Do not update destroyed atom
      store.destroy();
      store.set({ value: 3 });
      expect(store()).toEqual({ value: 2 });
    });

    it('must use a custom comparator', async () => {
      const store = atom(
        { value: 1, data: 'a' },
        { equal: (s1, s2) => s1.value === s2.value },
      );

      const changes = await collectChanges(store, () => {
        store.set({ value: 1, data: 'b' });
        expect(store()).toEqual({ value: 1, data: 'a' });

        store.set({ value: 2, data: 'c' });
        expect(store()).toEqual({ value: 2, data: 'c' });
      });

      expect(changes).toEqual([
        { value: 1, data: 'a' },
        { value: 2, data: 'c' },
      ]);
    });

    it('should not notify destroyed effect', () => {
      const onChange = jest.fn();

      const store = atom<number>(1);
      const fx = syncEffect(store, onChange);

      onChange.mockClear();
      store.set(2);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(2, expectEffectContext());

      onChange.mockClear();
      fx.destroy();
      store.set(3);
      const node = getSignalNode(fx.onDestroy);
      expect(node.isDestroyed).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(0);
    });

    it('should return true if the value is set', () => {
      const store = atom(1);
      expect(store.set(2)).toBe(true);
    });

    it('should return false if the value is NOT set', () => {
      const store = atom(1);
      expect(store.set(1)).toBe(false);
    });

    it('should return false if the store is destroyed', () => {
      const store = atom(1);
      store.destroy();
      expect(store.set(2)).toBe(false);
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

      const statePromise = collectChanges(store, () => {
        store.update((state) => state);
      });

      expect(await statePromise).toEqual([{ value: 1 }]);
    });

    it('should not subscribe and apply a mutation if the new atom is destroyed', async () => {
      const store = atom({ value: 1 });

      const statePromise = collectChanges(store, () => {
        store.update(({ value: prevValue }) => ({ value: prevValue + 1 }));
      });
      store.destroy();

      expect(await statePromise).toEqual([]);
    });

    it('should return true if the value is set', () => {
      const store = atom(1);
      expect(store.update(() => 2)).toBe(true);
    });

    it('should return false if the value is NOT set', () => {
      const store = atom(1);
      expect(store.update(() => 1)).toBe(false);
    });

    it('should return false if the store is destroyed', () => {
      const store = atom(1);
      store.destroy();
      expect(store.update(() => 2)).toBe(false);
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

  describe('asReadonly()', () => {
    it('should return a read-only representation of the writable Atom', () => {
      const source = atom(1);
      const readonly = source.asReadonly();

      expect(readonly).toBeInstanceOf(Function);
      expect(isAtom(readonly)).toBe(true);
      expect(readonly()).toBe(1);

      expect(readonly).not.toEqual(
        expect.objectContaining({
          set: expect.any(Function),
          update: expect.any(Function),
          mutate: expect.any(Function),
          asReadonly: expect.any(Function),
          destroy: expect.any(Function),
        }),
      );

      expect(readonly()).toEqual(1);

      source.set(2);
      expect(readonly()).toEqual(2);
    });

    test('Read-only atom should transmit "destroy" notification', () => {
      const source = atom(1);
      const readonly = source.asReadonly();
      const fx = syncEffect(readonly, () => {});

      source.destroy();
      expect(getSignalNode(fx.onDestroy).isDestroyed).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('should complete an internal store', async () => {
      const changes: number[] = [];
      const store = atom<number>(1);

      effect(store, (value) => changes.push(value));
      await flushMicrotasks();

      store.set(2);
      await flushMicrotasks();

      store.set(3);
      store.destroy();
      store.set(4);
      await flushMicrotasks();

      expect(changes).toEqual([1, 2]);
    });

    it('should call `onDestroy` callback', async () => {
      const onDestroy = jest.fn();
      const store = atom<number>(1, { onDestroy });

      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);

      // It should destroy once if called twice
      store.destroy();
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });

    it('should allow `onDestroy` callback to change its value', async () => {
      const store: WritableAtom<number> = atom<number>(1, {
        onDestroy: () => store.set(0),
      });

      expect(store()).toBe(1);

      store.destroy();
      expect(store()).toBe(0);
    });

    it('should not notify destroyed effects', () => {
      const onDestroy = jest.fn();

      const store = atom<number>(1);
      const fx = syncEffect(store, () => {});
      syncEffect(fx.onDestroy, onDestroy);

      store.set(2);
      fx.destroy();

      const node = getSignalNode(fx.onDestroy);

      expect(node.isDestroyed).toBe(true);
      expect(onDestroy).toHaveBeenCalledTimes(1);

      store.destroy();
      expect(node.isDestroyed).toBe(true);
      expect(onDestroy).toHaveBeenCalledTimes(1);

      store.destroy();
      expect(node.isDestroyed).toBe(true);
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});
