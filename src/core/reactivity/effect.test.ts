import { runEffects } from '../utils/runEffects';

import { atom } from './atom';
import { AtomUpdateError } from './atomUpdateError';
import { compute } from './compute';
import { effect, syncEffect } from './effect';
import { RUNTIME } from './runtime';

describe('effect()', () => {
  it('should subscribe to an atom', async () => {
    const a = atom(1);

    let result = 0;
    const fx = effect(a, (value) => (result = value));
    runEffects();
    expect(result).toBe(1);

    a.set(2);
    runEffects();
    expect(result).toBe(2);

    fx.destroy();
    a.set(3);
    runEffects();
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

    runEffects();
    expect(result).toBe(3);

    a.set(2);
    runEffects();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    runEffects();
    expect(result).toBe(4);
  });

  it('should handle a computing function', async () => {
    const a = atom(1);
    const b = atom(2);

    let result = 0;
    const fx = effect([a, b], ([a, b]) => (result = a + b));

    runEffects();
    expect(result).toBe(3);

    a.set(2);
    runEffects();
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    runEffects();
    expect(result).toBe(4);
  });

  it('should not lost its subscription context', async () => {
    const a = atom(0);

    const results: number[] = [];
    effect(a, (value) => results.push(value));
    runEffects();

    a.set(1);
    a.set(2);
    runEffects();
    expect(results).toEqual([0, 2]);

    a.set(3);
    a.set(4);
    expect(a()).toEqual(4);

    runEffects();
    expect(results).toEqual([0, 2, 4]);
  });

  it('should be destroyed when a source atom is destroyed', async () => {
    const source = atom(1);
    const destroyCallback = jest.fn();

    effect(source, (value) => value * value, { onDestroy: destroyCallback });

    runEffects();
    expect(destroyCallback).toHaveBeenCalledTimes(0);

    source.destroy();
    expect(destroyCallback).toHaveBeenCalledTimes(1);
  });

  it('should be destroyed when a source computed atom is destroyed', () => {
    const source = atom(1);
    const computed = compute(() => source());
    const destroyCallback = jest.fn();

    syncEffect(computed, () => {}, { onDestroy: destroyCallback });

    source.destroy();
    expect(destroyCallback).toHaveBeenCalledTimes(1);
  });
});

describe('syncEffect()', () => {
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
    const fx = syncEffect([a, b], ([a, b]) => (result = a + b));
    expect(result).toBe(3);

    a.set(2);
    expect(result).toBe(4);

    fx.destroy();
    a.set(3);
    expect(result).toBe(4);
  });
});

describe('Effect with a primitive value', () => {
  it('should trigger the syncEffect', () => {
    const source = atom(false);
    const callback = jest.fn();

    syncEffect(source, callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false);

    callback.mockClear();
    source.set(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true);
  });

  it('should trigger the effect', async () => {
    const source = atom(false);
    const callback = jest.fn();

    effect(source, callback);

    runEffects();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(false);

    callback.mockClear();
    source.set(true);

    runEffects();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(true);
  });
});

describe('Untracked context in the atom effect with the explicit dependency', () => {
  it('should be possible to update other atoms', async () => {
    const a = atom(1);
    const b = atom(0);

    const errorCallback = jest.fn();
    effect(a, (value) => b.set(value), { onError: errorCallback });

    runEffects();
    expect(b()).toBe(1);

    a.set(2);
    runEffects();
    expect(b()).toBe(2);

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });
});

describe('Tracked context in the effect with implicit dependencies', () => {
  it('should be NOT possible to update any atoms', async () => {
    const a = atom(1, { name: 'a' });
    const b = atom(0, { name: 'b' });

    const c = compute(() => {
      const value = a();
      b.set(value);
      return value;
    });

    const errorCallback = jest.fn();
    effect(c, () => {}, { onError: errorCallback });

    runEffects();
    expect(b()).toBe(0);

    a.set(2);
    runEffects();
    expect(b()).toBe(0);

    expect(errorCallback).toHaveBeenCalledTimes(2);
    expect(errorCallback).toHaveBeenNthCalledWith(1, new AtomUpdateError('b'));
    expect(errorCallback).toHaveBeenNthCalledWith(2, new AtomUpdateError('b'));
  });
});

describe('@regression Cycled effect on reading and updating the same atom', () => {
  it('should not trigger an infinite loop', async () => {
    const inputs = atom<string[]>([]);
    const store = atom<{ [key: string]: number }>({});

    effect(inputs, (items) => {
      const prevState = store();

      const nextState = { ...prevState };

      items.forEach((item) => {
        nextState[item] = (nextState[item] || 0) + 1;
      });

      const set = new Set(items);
      Object.keys(nextState).forEach((key) => {
        if (!set.has(key)) {
          delete nextState[key];
        }
      });

      store.set(nextState);
    });

    runEffects();
    expect(store()).toEqual({});

    inputs.set(['a']);
    runEffects();
    expect(store()).toEqual({ a: 1 });

    inputs.set(['a', 'b']);
    runEffects();
    expect(store()).toEqual({ a: 2, b: 1 });

    inputs.set(['b', 'c']);
    runEffects();
    expect(store()).toEqual({ b: 2, c: 1 });
  });

  it('should not trigger an infinite loop with ASYNC scheduler', async () => {
    type State = { [key: string]: number };

    const inputs = atom<string[]>([]);
    const store = atom<State>({});

    const updateStore = (state: State) => {
      RUNTIME.asyncScheduler.schedule(() => store.set(state));
    };

    effect(inputs, (items) => {
      const prevState = store();

      const nextState = { ...prevState };

      items.forEach((item) => {
        nextState[item] = (nextState[item] || 0) + 1;
      });

      const set = new Set(items);
      Object.keys(nextState).forEach((key) => {
        if (!set.has(key)) {
          delete nextState[key];
        }
      });

      updateStore(nextState);
    });

    runEffects();
    expect(store()).toEqual({});

    inputs.set(['a']);
    runEffects();
    expect(store()).toEqual({ a: 1 });

    inputs.set(['a', 'b']);
    runEffects();
    expect(store()).toEqual({ a: 2, b: 1 });

    inputs.set(['b', 'c']);
    runEffects();
    expect(store()).toEqual({ b: 2, c: 1 });
  });
});

describe('Explicit dependencies in the effect', () => {
  it('should be possible specify explicit Atom dependencies', async () => {
    const atomA = atom(1);
    const atomB = atom(0);
    const store = atom(0);

    effect([atomA, atomB], ([a, b]) => {
      store.update((prev) => prev + a + b);
    });

    runEffects();
    expect(store()).toBe(1);

    atomA.set(2);
    runEffects();
    expect(store()).toBe(3);

    atomB.set(3);
    runEffects();
    expect(store()).toBe(8);
  });
});

describe('Effect: waitChanges option', () => {
  it('should emits the changes of the source atom', () => {
    const source = atom(1);

    const spy = jest.fn();
    syncEffect(source, spy, { waitChanges: true });
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(2);
    expect(spy).toHaveBeenLastCalledWith(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    source.set(2);
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(3);
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('should asynchronously emits the changes of the source atom', async () => {
    const source = atom(1);

    const spy = jest.fn();
    effect(source, spy, { waitChanges: true });
    runEffects();
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(2);
    runEffects();
    expect(spy).toHaveBeenLastCalledWith(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    source.set(2);
    runEffects();
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(3);
    runEffects();
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('should not emit the changes if the source atom is destroyed', () => {
    const spy = jest.fn();
    const source = atom(1);

    syncEffect(source, spy, { waitChanges: true });

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    source.destroy();
    source.set(3);
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
