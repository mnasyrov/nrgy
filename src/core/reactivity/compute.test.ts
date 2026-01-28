import { flushMicrotasks } from '../../test/flushMicrotasks';
import { createScope } from '../scope/createScope';
import { runEffects } from '../utils/runEffects';

import {
  atom,
  AtomUpdateError,
  compute,
  effect,
  getAtomLabel,
  RUNTIME,
  syncEffect,
} from './reactivity';
import { Atom } from './types';

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
    runEffects();

    entry.set(1);
    runEffects();

    entry.set(2);
    runEffects();

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

    runEffects();

    i = 1;
    b.set('b1a');
    runEffects();

    i = 2;
    a.set('a2');
    b.set('b2');
    runEffects();

    i = 3;
    isA.set(false);
    runEffects();

    i = 4;
    b.set('b3');
    runEffects();

    i = 5;
    a.set('a4');
    runEffects();

    i = 6;
    a.set('a5');
    runEffects();

    expect(results).toEqual(['a1, i0', 'a2, i2', 'b2, i3', 'b3, i4', 'b3, i5']);
  });

  it('should not compute external dependencies if the atom was not changed', async () => {
    let value = 1;
    const subscribed = compute(() => value);
    const notSubscribed = compute(() => value);

    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

    const results: any[] = [];
    const { destroy } = effect(subscribed, (value) => results.push(value));

    runEffects();

    value = 2;
    runEffects();

    value = 3;
    runEffects();

    value = 4;
    runEffects();
    expect(subscribed()).toBe(1);
    runEffects();

    destroy();

    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

    // Trigger recalculations
    atom(10).set(11);
    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

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
    runEffects();

    source.set(1);
    runEffects();

    source.set(2);
    runEffects();

    fx.destroy();

    expect(results).toEqual([2, 3, 4]);
  });

  it('should compute "entry -> a -> observer" chain', async () => {
    const source = atom(1);

    const a = compute(() => source() * 10);
    expect(a()).toBe(10);

    const changes: number[] = [];
    effect(a, (value) => changes.push(value));
    runEffects();

    source.set(2);
    runEffects();

    source.set(3);
    runEffects();

    expect(changes).toEqual([10, 20, 30]);
  });

  it('should compute "entry -> a -> b -> observer" chain', async () => {
    const entry = atom(0);

    const a = compute(() => entry() + 1);
    const b = compute(() => a() + 1);

    expect(b()).toEqual(2);

    const changes: number[] = [];
    effect(b, (value) => changes.push(value));
    runEffects();

    entry.set(1);
    expect(b()).toEqual(3);

    runEffects();

    entry.set(2);
    expect(b()).toEqual(4);

    runEffects();

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

    const changes: any[] = [];
    effect(b, (value) => changes.push(value));
    runEffects();

    s1.set(1);
    // expect(b()).toEqual({ a: 2, b: 0 });
    expect(b()).toEqual({ a: 1, b: 0 });
    runEffects();

    s1.set(2);
    // expect(b()).toEqual({ a: 3, b: 0 });
    expect(b()).toEqual({ a: 1, b: 0 });
    runEffects();

    s1.set(3);
    // expect(b()).toEqual({ a: 4, b: 0 });
    expect(b()).toEqual({ a: 1, b: 0 });
    runEffects();

    s2.set(2);
    expect(b()).toEqual({ a: 4, b: 2 });
    runEffects();

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

    const changes: number[] = [];
    effect(d, (value) => changes.push(value));
    runEffects();

    entry.set(1);
    expect(d()).toEqual(7);
    runEffects();

    entry.set(2);
    expect(d()).toEqual(9);
    runEffects();

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

    const onErrorCallback = jest.fn();
    effect(result, () => {}, { onError: onErrorCallback });

    runEffects();

    expect(onErrorCallback).toHaveBeenNthCalledWith(
      1,
      new Error('Detected cycle in computations'),
    );
  });

  it('should propagate "error" event from a source to observers', async () => {
    let errorId = 0;
    const source = atom(1);

    const query1 = compute(() => {
      const result = source() + 1;
      if (errorId > 0) throw `Test error ${errorId}`;
      return result;
    });
    const query2 = compute(() => query1() * 2);

    const fxScope = createScope();

    const history1: any[] = [];
    fxScope.effect(query2, (value) => history1.push({ value }), {
      onError: (error: any) => history1.push({ error }),
    });

    runEffects();

    errorId++;
    source.set(2);
    runEffects();

    expect(history1).toEqual([{ value: 4 }, { error: 'Test error 1' }]);
    fxScope.destroy();

    const history2: any[] = [];
    fxScope.effect(query2, (value) => history2.push({ value }), {
      onError: (error: any) => history2.push({ error }),
    });

    runEffects();

    errorId++;
    source.set(3);
    runEffects();

    expect(history2).toEqual([
      { error: 'Test error 1' },
      { error: 'Test error 2' },
    ]);
    fxScope.destroy();
  });

  it('should throw an error on subscription to an incorrect dependency', async () => {
    const query1 = compute(() => {
      throw new Error('Some error');
    });

    const onErrorCallback = jest.fn();
    effect(query1, () => {}, { onError: onErrorCallback });

    runEffects();

    expect(onErrorCallback).toHaveBeenNthCalledWith(1, expect.any(Error));
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

    runEffects();

    expect(onSumChanged).toHaveBeenCalledWith('ab');
    expect(onSumChanged).toHaveBeenCalledTimes(1);

    onSumChanged.mockClear();

    const storeChanges: any[] = [];
    effect(store, (state) => storeChanges.push(state));
    runEffects();

    effect(sum, (sum) => store.update((state) => ({ ...state, sum })));
    runEffects();

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

    const subscription = effect(
      nextResult,
      (result) => {
        store.update((state) => ({ ...state, result }));
      },
      { waitChanges: true },
    );

    const storeChanges: any[] = [];
    effect(store, (state) => storeChanges.push(state));
    runEffects();

    expect(nextResult()).toEqual({ value: 0 });

    store.update((state) => ({ ...state, a: 1 }));
    expect(nextResult()).toEqual({ value: 1 });

    runEffects();

    subscription?.destroy();

    expect(storeChanges).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should do not lost sync effect of an intermediate computed', async () => {
    const source = atom({ a: 0 }, { label: 'source' });

    const a = compute(() => source().a, { label: 'a' });
    const b = compute(() => a() + 10, { label: 'b' });

    const sourceChanges: any[] = [];
    syncEffect(source, (value) => sourceChanges.push(value));

    const bChanges: any[] = [];
    syncEffect(b, (value) => bChanges.push(value));

    source.set({ a: 1 });

    expect(sourceChanges).toEqual([{ a: 0 }, { a: 1 }]);
    expect(bChanges).toEqual([10, 11]);
  });

  it('should do not lost async effect of an intermediate computed', async () => {
    const source = atom({ a: 0 }, { label: 'source' });

    const a = compute(() => source().a, { label: 'a' });
    const b = compute(() => a() + 10, { label: 'b' });

    const sourceChanges: any[] = [];
    effect(source, (value) => sourceChanges.push(value));

    const bChanges: any[] = [];
    effect(b, (value) => bChanges.push(value));

    await flushMicrotasks();
    source.set({ a: 1 });
    await flushMicrotasks();

    expect(sourceChanges).toEqual([{ a: 0 }, { a: 1 }]);
    expect(bChanges).toEqual([10, 11]);
  });

  it('should handle recursion during store updates: Intermediate compute', async () => {
    const source = atom({ a: 0, b: 0 }, { label: 'source' });

    const a = compute(() => source().a, { label: 'a' });
    const b = compute(() => a() + 10, { label: 'b' });

    const subscription = effect(
      b,
      (value) => {
        source.update((state) => ({ ...state, b: value }));
      },
      { label: 'Update the source when "b" is changed' },
    );

    const sourceChanges: any[] = [];
    syncEffect(source, (value) => sourceChanges.push(value));

    await flushMicrotasks();
    source.update((state) => ({ ...state, a: 1 }));
    await flushMicrotasks();

    subscription?.destroy();

    expect(sourceChanges).toEqual([
      { a: 0, b: 0 },
      { a: 0, b: 10 },
      { a: 1, b: 10 },
      { a: 1, b: 11 },
    ]);
  });

  it('should handle recursion during store updates: Intermediate compute #2, waitChanges', async () => {
    const source = atom({ a: 0, b: 0 }, { label: 'source' });

    const a = compute(() => source().a, { label: 'a' });
    const b = compute(() => a() + 10, { label: 'b' });

    const subscription = effect(
      b,
      (value) => {
        source.update((state) => ({ ...state, b: value }));
      },
      { label: 'Update the source when "b" is changed', waitChanges: true },
    );

    const sourceChanges: any[] = [];
    syncEffect(source, (value) => sourceChanges.push(value));

    await flushMicrotasks();
    source.update((state) => ({ ...state, a: 1 }));
    await flushMicrotasks();

    subscription?.destroy();

    expect(sourceChanges).toEqual([
      { a: 0, b: 0 },
      { a: 1, b: 0 },
      { a: 1, b: 11 },
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

    {
      const store1Changes: any[] = [];
      effect(store1, (state) => store1Changes.push(state));
      runEffects();

      store1.update((state) => ({ ...state, a: 1 }));
      runEffects();
    }

    subscription1?.destroy();

    runEffects();

    // Expect that the runtime in empty
    expect(RUNTIME.activeObserver).toBe(undefined);
    expect(RUNTIME.asyncScheduler.isEmpty()).toBe(true);
    expect(RUNTIME.syncScheduler.isEmpty()).toBe(true);

    const store = atom({ a: 0, result: { value: 0 } });

    const a = compute(() => store().a);
    const nextResult = compute(() => ({ value: a() }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = effect(
      nextResult,
      (result) => {
        store.update((state) => ({ ...state, result }));
      },
      { waitChanges: true },
    );

    const changes: any[] = [];
    effect(store, (state) => changes.push(state));
    runEffects();

    runEffects();
    store.update((state) => ({ ...state, a: 1 }));
    runEffects();

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

    const changes: any[] = [];
    effect(query, (value) => changes.push(value));
    runEffects();

    source.set({ key: 1, val: 'a' });
    source.set({ key: 1, val: 'b' });
    source.set({ key: 2, val: 'c' });
    runEffects();

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
    const source = atom(1);

    // Create derived computation
    const compute1 = compute(() => source() * 2);
    const compute2 = compute(() => source() + compute1());

    // Fake subscriptions
    const callback = jest.fn();
    effect(compute2, (value) => callback('fx1', value));
    effect(compute2, (value) => callback('fx2', value));
    runEffects();

    // Update
    source.set(2);
    runEffects();

    expect(callback).toHaveBeenNthCalledWith(1, 'fx1', 3);
    expect(callback).toHaveBeenNthCalledWith(2, 'fx2', 3);
    expect(callback).toHaveBeenNthCalledWith(3, 'fx1', 6);
    expect(callback).toHaveBeenNthCalledWith(4, 'fx2', 6);
    expect(callback).toHaveBeenCalledTimes(4);
  });
});

describe('ComputedImpl()', () => {
  it('should tell about a changed state', () => {
    const source = atom('a');
    const other = atom('something 1');
    const computed = compute(() => source());

    // Case 1: recalculation is triggered by result.isChanged()
    expect(computed()).toBe('a');

    // Case 2: recalculation is triggered by result.get()
    source.set('b');

    expect(computed()).toBe('b');

    expect(computed()).toBe('b');

    /*
    Case 3: another atom increases ATOM_CLOCK, the result makes recalculation,
    but its value remains the same.
    */
    other.set('something 2');

    expect(computed()).toBe('b');
  });
});

describe('getAtomLabel() with the computed atom', () => {
  it('should return a label of computed atoms', () => {
    const namelessAtom = compute(() => 1);
    expect(getAtomLabel(namelessAtom)).toBe(undefined);

    const namedAtom = compute(() => 1, { label: 'foo' });
    expect(getAtomLabel(namedAtom)).toBe('foo');
  });
});

describe('Tracked context in the computed expression with implicit dependencies', () => {
  it('should be NOT possible to update any atoms', async () => {
    const a = atom(1, { label: 'a' });
    const b = atom(0, { label: 'b' });

    const c = compute(() => {
      const value = a();
      b.set(value);
      return value;
    });

    // It is not possible to detect explicit invocation of ComputedNode.get();
    expect(() => c()).not.toThrow(new AtomUpdateError('b'));

    const errorCallback = jest.fn();
    effect(c, () => {}, { onError: errorCallback });
    runEffects();
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenNthCalledWith(
      1,
      new AtomUpdateError('SourceAtom b'),
    );

    runEffects();
    expect(b()).toBe(0);

    errorCallback.mockClear();
    a.set(2);
    runEffects();
    expect(b()).toBe(0);

    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(errorCallback).toHaveBeenNthCalledWith(
      1,
      new AtomUpdateError('SourceAtom b'),
    );
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

describe('One source and two computed atoms', () => {
  test('One source and two computed atoms', async () => {
    const a1 = atom(1);
    const c1 = compute(() => a1());
    const c2 = compute(() => a1() * 10);
    const result = compute(() => c1() + c2());

    const history1: number[] = [];
    const history2: number[] = [];
    effect(result, (value) => history1.push(value));
    effect(result, (value) => history2.push(value));

    runEffects();

    a1.set(2);
    runEffects();

    a1.set(3);
    runEffects();

    expect(history1).toEqual([11, 22, 33]);
    expect(history2).toEqual([11, 22, 33]);
  });
});
