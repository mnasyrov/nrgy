import { expectEffectContext } from '../../test/matchers';
import {
  collectChanges,
  collectHistory,
  flushMicrotasks,
  promiseTimeout,
} from '../../test/testUtils';
import { Atom } from '../common/types';
import { effect, syncEffect } from '../effects/effect';
import { RUNTIME } from '../internals/runtime';
import { signal } from '../signals/signal';
import { createAtomSubject } from '../utils/atomSubject';
import { signalChanges } from '../utils/signalChanges';

import { AtomUpdateError, getAtomName } from './atom';
import { compute, ComputedImpl } from './compute';
import { atom } from './writableAtom';

describe('compute()', () => {
  it('should calculate the benchmark with async effect', async () => {
    const entry = atom(0); // 0

    const a = compute(() => entry()); // [0] -> 0
    const b = compute(() => a() + 1); // [0] -> 1
    const c = compute(() => a() + 1); // [0] -> 1
    const d = compute(() => b() + c()); // [1, 1] -> 2
    const e = compute(() => d() + 1); // [2] -> 3
    const f = compute(() => d() + e()); // [2, 3] -> 5
    const g = compute(() => d() + e()); // [2, 3] -> 5
    const h = compute(() => f() + g()); // [5, 5] -> 10

    const results: number[] = [];

    effect(h, (value) => results.push(value));
    await flushMicrotasks();

    entry.set(1);
    await flushMicrotasks();

    entry.set(2);
    await flushMicrotasks();

    expect(results).toEqual([10, 18, 26]);
  });

  it('should calculate the benchmark with synchronous effect', () => {
    const entry = atom(0); // 0

    const a = compute(() => entry()); // [0] -> 0
    const b = compute(() => a() + 1); // [0] -> 1
    const c = compute(() => a() + 1); // [0] -> 1
    const d = compute(() => b() + c()); // [1, 1] -> 2
    const e = compute(() => d() + 1); // [2] -> 3
    const f = compute(() => d() + e()); // [2, 3] -> 5
    const g = compute(() => d() + e()); // [2, 3] -> 5
    const h = compute(() => f() + g()); // [5, 5] -> 10

    const results: number[] = [];

    syncEffect(h, (value) => results.push(value));

    entry.set(1);
    entry.set(2);

    expect(results).toEqual([10, 18, 26]);
  });

  it('should process dynamic dependencies', async () => {
    let i = 0;
    const isA = atom(true);
    const a = atom('a1');
    const b = atom('b1');

    const output = compute(() => (isA() ? a() : b()) + `, i${i}`);

    const results: any[] = [];
    effect(output, (value) => results.push(value));

    await flushMicrotasks();

    i = 1;
    b.set('b1a');
    await flushMicrotasks();

    i = 2;
    a.set('a2');
    b.set('b2');
    await flushMicrotasks();

    i = 3;
    isA.set(false);
    await flushMicrotasks();

    i = 4;
    b.set('b3');
    await flushMicrotasks();

    i = 5;
    a.set('a4');
    await flushMicrotasks();

    expect(results).toEqual(['a1, i0', 'a2, i2', 'b2, i3', 'b3, i4']);
  });

  it('should not compute external dependencies in an atom was not changed', async () => {
    let value = 1;
    const subscribed = compute(() => value);
    const notSubscribed = compute(() => value);

    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

    const results: any[] = [];
    const { destroy } = effect(subscribed, (value) => results.push(value));

    await flushMicrotasks();

    value = 2;
    await flushMicrotasks();

    value = 3;
    await flushMicrotasks();

    value = 4;
    await flushMicrotasks();
    expect(subscribed()).toBe(1);
    await flushMicrotasks();

    destroy();

    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

    // Trigger recalculations
    atom(10).set(11);
    expect(subscribed()).toBe(4);
    expect(notSubscribed()).toBe(4);

    expect(results).toEqual([1]);
  });

  it('should have typings to return another type', () => {
    const source = atom<number>(1);
    const query: Atom<string> = compute(() => source() + '!');
    expect(query()).toBe('1!');
  });

  it('should compute "entry -> a" chain', async () => {
    const source = atom(1);

    const a = compute(() => source() * 10);
    expect(a()).toEqual(10);

    source.set(2);
    expect(a()).toEqual(20);

    source.set(3);
    expect(a()).toEqual(30);
  });

  it('should work with a simple sync effect', () => {
    const source = atom(0);
    const a = compute(() => source() + 1);
    const b = compute(() => a() + 1);

    const results: number[] = [];
    const fx = syncEffect(b, (value) => results.push(value));
    source.set(1);
    source.set(2);
    fx.destroy();

    expect(results).toEqual([2, 3, 4]);
  });

  it('should work with a simple async effect', async () => {
    const source = atom(0);
    const a = compute(() => source() + 1);
    const b = compute(() => a() + 1);

    const results: number[] = [];

    const fx = effect(b, (value) => results.push(value));
    await flushMicrotasks();

    source.set(1);
    await flushMicrotasks();

    source.set(2);
    await flushMicrotasks();

    fx.destroy();

    expect(results).toEqual([2, 3, 4]);
  });

  it('should compute "entry -> a -> observer" chain', async () => {
    const source = atom(1);

    const a = compute(() => source() * 10);

    const changes = await collectChanges(a, async () => {
      source.set(2);

      await flushMicrotasks();

      source.set(3);
    });

    expect(changes).toEqual([10, 20, 30]);
  });

  it('should compute "entry -> a -> b -> observer" chain', async () => {
    const entry = atom(0);

    const a = compute(() => entry() + 1);
    const b = compute(() => a() + 1);

    expect(b()).toEqual(2);

    // const changes = await collectChanges(b, async () => {
    //   entry.set(1);
    //   expect(b()).toEqual(3);
    //
    //   await flushMicrotasks();
    //
    //   entry.set(2);
    //   expect(b()).toEqual(4);
    // });

    const changes: number[] = [];
    effect(b, (value) => changes.push(value));
    await flushMicrotasks();

    entry.set(1);
    expect(b()).toEqual(3);

    await flushMicrotasks();

    entry.set(2);
    expect(b()).toEqual(4);

    await flushMicrotasks();

    expect(changes).toEqual([2, 3, 4]);
  });

  it('should compute a chain: s1 -> a; a + s2 -> b; b -> observer', async () => {
    const s1 = atom(0);
    const s2 = atom(0);

    const a = compute(() => s1() + 1);
    const b = compute(() => ({ a: a(), b: s2() }), {
      equal: (prev, next) => prev.b === next.b,
    });

    expect(b()).toEqual({ a: 1, b: 0 });

    const changes = await collectChanges(b, () => {
      s1.set(1);
      // expect(b()).toEqual({ a: 2, b: 0 });
      expect(b()).toEqual({ a: 1, b: 0 });

      s1.set(2);
      // expect(b()).toEqual({ a: 3, b: 0 });
      expect(b()).toEqual({ a: 1, b: 0 });

      s1.set(3);
      // expect(b()).toEqual({ a: 4, b: 0 });
      expect(b()).toEqual({ a: 1, b: 0 });

      s2.set(2);
      expect(b()).toEqual({ a: 4, b: 2 });
    });

    expect(changes).toEqual([
      { a: 1, b: 0 },
      { a: 4, b: 2 },
    ]);
  });

  it('should compute "entry -> a -> b/c -> d -> observer" chain', async () => {
    const entry = atom(0);

    const a = compute(() => entry() + 1);
    const b = compute(() => a() + 1);
    const c = compute(() => a() + 1);
    const d = compute(() => b() + c() + 1);

    expect(d()).toEqual(5);

    const changes = await collectChanges(d, async () => {
      entry.set(1);
      expect(d()).toEqual(7);

      await flushMicrotasks();

      entry.set(2);
      expect(d()).toEqual(9);
    });

    expect(changes).toEqual([5, 7, 9]);
  });

  it('should throw an error on a cycle', async () => {
    const entry = atom(0);

    const a = compute(() => entry() + 1);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const b = compute(() => a() + c() + 1);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-var
    var c = compute(() => b() + 1);

    const result = compute(() => c());

    expect(() => result()).toThrow(new Error('Detected cycle in computations'));

    const history = await collectHistory(result, () => {});
    expect(history).toEqual([
      {
        type: 'error',
        error: new Error('Detected cycle in computations'),
      },
    ]);
  });

  it('should propagate "error" event from a source to observers', async () => {
    const source = createAtomSubject<number>(1);

    const query1 = compute(() => source() + 1);
    const query2 = compute(() => query1() * 2);

    const history1 = await collectHistory(query2, async () => {
      await flushMicrotasks();

      source.error('Test error 1');
    });
    expect(history1).toEqual([
      { type: 'value', value: 4 },
      { type: 'error', error: 'Test error 1' },
    ]);

    const history2 = await collectHistory(query2, () => {
      source.error('Test error 2');
    });
    expect(history2).toEqual([
      { type: 'error', error: 'Test error 1' },
      { type: 'error', error: 'Test error 2' },
    ]);
  });

  it('should throw an error on subscription to an incorrect dependency', async () => {
    const query1 = compute(() => {
      throw new Error('Some error');
    });

    const history = await collectHistory(query1, () => {});
    expect(history).toEqual([
      {
        type: 'error',
        error: expect.any(Error),
      },
    ]);
  });

  it('should notify an observer only once on subscribe', async () => {
    const store = atom<{ v1: string; v2: string; sum?: string }>(
      {
        v1: 'a',
        v2: 'b',
        sum: undefined,
      },
      // { equal: (a, b) => a.v1 === b.v1 && a.v2 === b.v2 && a.sum === b.sum },
    );

    const v1 = compute(() => store().v1);
    const v2 = compute(() => store().v2);

    const sum = compute(() => v1() + v2());

    const onSumChanged = jest.fn();
    effect(sum, onSumChanged);

    await flushMicrotasks();

    expect(onSumChanged).toHaveBeenCalledWith('ab', expectEffectContext());
    expect(onSumChanged).toHaveBeenCalledTimes(1);

    onSumChanged.mockClear();

    const storeChanges = await collectChanges(store, () => {
      effect(sum, (sum) => store.update((state) => ({ ...state, sum })));
    });

    expect(storeChanges).toEqual([
      { sum: undefined, v1: 'a', v2: 'b' },
      { sum: 'ab', v1: 'a', v2: 'b' },
    ]);
    expect(onSumChanged).toHaveBeenCalledTimes(0);
  });

  it('should handle recursion during store updates: Value selector', async () => {
    const store = atom({ a: 0, result: { value: 0 } });

    const nextResult = compute(() => ({ value: store().a }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = effect(signalChanges(nextResult), (result) => {
      store.update((state) => ({ ...state, result }));
    });

    const changes = await collectChanges(store, async () => {
      expect(nextResult()).toEqual({ value: 0 });

      store.update((state) => ({ ...state, a: 1 }));

      expect(nextResult()).toEqual({ value: 1 });

      await flushMicrotasks();
    });

    subscription?.destroy();

    expect(changes).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should handle recursion during store updates: Intermediate compute', async () => {
    const store = atom({ a: 0, result: { value: 0 } });

    const a = compute(() => store().a);
    const nextResult = compute(() => ({ value: a() }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = effect(signalChanges(nextResult), (result) => {
      store.update((state) => ({ ...state, result }));
    });

    const changes = await collectChanges(store, async () => {
      await flushMicrotasks();

      store.update((state) => ({ ...state, a: 1 }));

      await flushMicrotasks();
    });

    subscription?.destroy();

    expect(changes).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should correctly clean tracked effects', async () => {
    const store1 = atom({ a: 0, result: { value: 0 } });

    const nextResult1 = compute(() => ({ value: store1().a }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription1 = effect(nextResult1, (result) => {
      store1.update((state) => ({ ...state, result }));
    });

    await collectChanges(store1, async () => {
      store1.update((state) => ({ ...state, a: 1 }));
    });

    subscription1?.destroy();

    await flushMicrotasks();

    // Expect that the runtime in empty
    expect(RUNTIME.atomSources).toBe(undefined);
    expect(RUNTIME.asyncScheduler.isEmpty()).toBe(true);
    expect(RUNTIME.syncScheduler.isEmpty()).toBe(true);

    const store = atom({ a: 0, result: { value: 0 } });

    const a = compute(() => store().a);
    const nextResult = compute(() => ({ value: a() }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = effect(signalChanges(nextResult), (result) => {
      store.update((state) => ({ ...state, result }));
    });

    const changes = await collectChanges(store, async () => {
      await flushMicrotasks();
      store.update((state) => ({ ...state, a: 1 }));
    });

    subscription?.destroy();

    expect(changes).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should use a custom comparator', async () => {
    const source = atom({ key: 1, val: 'a' });

    const query = compute(() => source(), {
      equal: (a, b) => a.key === b.key,
    });

    const changes = await collectChanges(query, () => {
      source.set({ key: 1, val: 'a' });
      source.set({ key: 1, val: 'b' });
      source.set({ key: 2, val: 'c' });
    });

    expect(changes).toEqual([
      { key: 1, val: 'a' },
      { key: 2, val: 'c' },
    ]);
  });

  it('should use a getter without selector', async () => {
    const source = atom({ key: 1, val: 'a' });

    const query = compute(() => source());
    expect(query()).toEqual({ key: 1, val: 'a' });
  });

  it('should do extra computing after reading by an effect', async () => {
    const counter = atom(0);

    // Tracks how many reads of `counter()` there have been.
    let readCount = 0;
    const result = compute(() => {
      readCount++;
      return { value: counter() };
    });

    const callback = jest.fn();
    const subscription = syncEffect(result, callback);
    expect(readCount).toBe(1);
    expect(callback).toHaveBeenCalledTimes(1);

    counter.set(1);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(readCount).toBe(2);

    // Should not do extra computing here
    result();
    expect(readCount).toBe(2);

    // Tear down the only subscription.
    subscription.destroy();
  });

  it('should recalculate once', async () => {
    const counter = atom(1);
    let i = 1;
    let j = 1;

    // Create derived computation
    const doubled = compute(() => {
      console.log('doubled', i++);
      return counter() * 2;
    });
    const formula = compute(() => {
      console.log('formula', j++);
      return counter() + doubled();
    });

    // !!! TODO: Remove console.log
    effect(formula, (value) => console.log('f1', value));
    effect(formula, (value) => console.log('f2', value));

    // Update
    setTimeout(() => counter.set(2), 100);

    await promiseTimeout(200);

    expect(i).toBe(3);
    expect(j).toBe(3);
  });
});

describe('ComputedImpl()', () => {
  it('should tell about a changed state', () => {
    const source = atom('a');
    const other = atom('something 1');
    const result = new ComputedImpl(() => source());

    // Case 1: recalculation is triggered by result.isChanged()
    expect(result.version).toBe(0);

    expect(result.get()).toBe('a');
    expect(result.version).toBe(1);

    // Case 2: recalculation is triggered by result.get()
    source.set('b');
    expect(result.version).toBe(1);

    expect(result.get()).toBe('b');
    expect(result.version).toBe(2);

    expect(result.get()).toBe('b');
    expect(result.version).toBe(2);

    /*
    Case 3: other atom increases ATOM_CLOCK, the result makes recalculation,
    but its value remains the same.
    */
    other.set('something 2');
    expect(result.version).toBe(2);

    expect(result.get()).toBe('b');
    expect(result.version).toBe(2);
  });

  describe('destroy()', () => {
    it('should reset a cached value and recalculate it on access', () => {
      const source = atom('a');
      const result = new ComputedImpl(() => source());

      expect((result as any).value).not.toBe('a');
      expect(result.get()).toBe('a');
      expect((result as any).value).toBe('a');

      const prevVersion = result.version;
      result.destroy();

      expect((result as any).value).not.toBe('a');
      expect(result.get()).toBe('a');
      expect((result as any).value).toBe('a');

      expect(result.version).toBeGreaterThan(prevVersion);
    });
  });
});

describe('getAtomName() with the computed atom', () => {
  it('should return a name of computed atoms', () => {
    const namelessAtom = compute(() => 1);
    expect(getAtomName(namelessAtom)).toBe(undefined);

    const namedAtom = compute(() => 1, { name: 'foo' });
    expect(getAtomName(namedAtom)).toBe('foo');
  });
});

describe('Tracked context in the computed expression with implicit dependencies', () => {
  it('should be NOT possible to update any atoms', async () => {
    const a = atom(1, { name: 'a' });
    const b = atom(0, { name: 'b' });

    const c = compute(() => {
      const value = a();
      b.set(value);
      return value;
    });

    // It is not possible to detect explicit invocation of ComputedNode.get();
    expect(() => c()).not.toThrow(new AtomUpdateError('b'));

    const fx = effect(c, () => {});

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(b()).toBe(1);

    a.set(2);
    await flushMicrotasks();
    expect(b()).toBe(1);

    expect(errorCallback).toHaveBeenCalledTimes(2);
    expect(errorCallback).toHaveBeenNthCalledWith(
      1,
      new AtomUpdateError('b'),
      expectEffectContext(),
    );
    expect(errorCallback).toHaveBeenNthCalledWith(
      2,
      new AtomUpdateError('b'),
      expectEffectContext(),
    );
  });

  it('should be possible to notify signals, but the expression is not pure', async () => {
    const a = atom(1, { name: 'a' });
    const s = signal<number>();

    const signalCallback = jest.fn();
    effect(s, signalCallback);

    const c = compute(() => {
      const value = a();
      s(value);
      return value;
    });

    const fx = effect(c, () => {});

    const errorCallback = jest.fn();
    effect(fx.onError, errorCallback);

    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(1, expectEffectContext());

    signalCallback.mockClear();
    a.set(2);
    await flushMicrotasks();
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(2, expectEffectContext());

    expect(errorCallback).toHaveBeenCalledTimes(0);
  });
});

describe('Leaking tracked effects by compute()', () => {
  it('should track only ', () => {
    const a = atom(10);
    const b = compute(() => a());

    const trigger = atom(true);
    const results: number[] = [];
    const callback = jest.fn(() => results.push(b()));

    syncEffect(trigger, callback);
    trigger.set(false);
    a.destroy();
    trigger.set(true);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(results).toEqual([10, 10, 10]);
  });
});
