import { collectChanges } from '../test/testUtils';

import { atom } from './atom';

describe('atom()', () => {
  it('should create a value store with the provided initial state', () => {
    const store = atom(1);

    expect(store).toBeInstanceOf(Function);

    expect(store).toEqual(
      expect.objectContaining({
        set: expect.any(Function),
        update: expect.any(Function),
        mutate: expect.any(Function),
        asReadonly: expect.any(Function),
        destroy: expect.any(Function),
      }),
    );

    expect(store()).toEqual(1);
  });
});

describe('Atom', () => {
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
