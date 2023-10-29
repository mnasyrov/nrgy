import { toObservable } from '../rxjs/_public';
import {
  collectChanges,
  collectHistory,
  flushMicrotasks,
} from '../test/testUtils';

import { defaultEquals, Signal } from './common';
import { compute, ComputedImpl } from './compute';
import { effect, syncEffect } from './effect';
import { SIGNAL_RUNTIME } from './runtime';
import { signal } from './signal';
import { createSignalSubject } from './signalSubject';

describe('compute()', () => {
  it('should calculate the benchmark with async effect', async () => {
    const entry = signal(0); // 0

    const a = compute(() => entry()); // [0] -> 0
    const b = compute(() => a() + 1); // [0] -> 1
    const c = compute(() => a() + 1); // [0] -> 1
    const d = compute(() => b() + c()); // [1, 1] -> 2
    const e = compute(() => d() + 1); // [2] -> 3
    const f = compute(() => d() + e()); // [2, 3] -> 5
    const g = compute(() => d() + e()); // [2, 3] -> 5
    const h = compute(() => f() + g()); // [5, 5] -> 10

    const results: number[] = [];

    effect(() => results.push(h()));
    await 0;

    entry.set(1);
    await 0;

    entry.set(2);
    await 0;

    expect(results).toEqual([10, 18, 26]);
  });

  it('should calculate the benchmark with synchronous effect', () => {
    const entry = signal(0); // 0

    const a = compute(() => entry()); // [0] -> 0
    const b = compute(() => a() + 1); // [0] -> 1
    const c = compute(() => a() + 1); // [0] -> 1
    const d = compute(() => b() + c()); // [1, 1] -> 2
    const e = compute(() => d() + 1); // [2] -> 3
    const f = compute(() => d() + e()); // [2, 3] -> 5
    const g = compute(() => d() + e()); // [2, 3] -> 5
    const h = compute(() => f() + g()); // [5, 5] -> 10

    const results: number[] = [];

    syncEffect(() => results.push(h()));

    entry.set(1);
    entry.set(2);

    expect(results).toEqual([10, 18, 26]);
  });

  it('should process dynamic dependencies', async () => {
    let i = 0;
    const isA = signal(true);
    const a = signal('a1');
    const b = signal('b1');

    const output = compute(() => (isA() ? a() : b()) + `, i${i}`);

    const results: any[] = [];
    effect(() => results.push(output()));

    await 0;

    i = 1;
    b.set('b1a');
    await 0;

    i = 2;
    a.set('a2');
    b.set('b2');
    await 0;

    i = 3;
    isA.set(false);
    await 0;

    i = 4;
    b.set('b3');
    await 0;

    i = 5;
    a.set('a4');
    await 0;

    expect(results).toEqual(['a1, i0', 'a2, i2', 'b2, i3', 'b3, i4']);
  });

  it('should not compute external dependencies in a signal was not changed', async () => {
    let value = 1;
    const subscribed = compute(() => value);
    const notSubscribed = compute(() => value);

    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

    const results: any[] = [];
    const { destroy } = effect(() => results.push(subscribed()));

    await 0;

    value = 2;
    await 0;

    value = 3;
    await 0;

    value = 4;
    await 0;
    expect(subscribed()).toBe(1);
    await 0;

    destroy();

    expect(subscribed()).toBe(1);
    expect(notSubscribed()).toBe(1);

    // Trigger recalculations
    signal(10).set(11);
    expect(subscribed()).toBe(4);
    expect(notSubscribed()).toBe(4);

    expect(results).toEqual([1]);
  });

  it('should have typings to return another type', () => {
    const source = signal<number>(1);
    const query: Signal<string> = compute(() => source() + '!');
    expect(query()).toBe('1!');
  });

  it('should compute "entry -> a" chain', async () => {
    const source = signal(1);

    const a = compute(() => source() * 10);
    expect(a()).toEqual(10);

    source.set(2);
    expect(a()).toEqual(20);

    source.set(3);
    expect(a()).toEqual(30);
  });

  it('should work with a simple sync effect', () => {
    const source = signal(0);
    const a = compute(() => source() + 1);
    const b = compute(() => a() + 1);

    const results: number[] = [];
    const fx = syncEffect(() => results.push(b()));
    source.set(1);
    source.set(2);
    fx.destroy();

    expect(results).toEqual([2, 3, 4]);
  });

  it('should work with a simple async effect', async () => {
    const source = signal(0);
    const a = compute(() => source() + 1);
    const b = compute(() => a() + 1);

    const results: number[] = [];

    const fx = effect(() => results.push(b()));
    await flushMicrotasks();

    source.set(1);
    await flushMicrotasks();

    source.set(2);
    await flushMicrotasks();

    fx.destroy();

    expect(results).toEqual([2, 3, 4]);
  });

  it('should compute "entry -> a -> observer" chain', async () => {
    const source = signal(1);

    const a = compute(() => source() * 10);

    const changes = await collectChanges(a, async () => {
      source.set(2);

      await flushMicrotasks();

      source.set(3);
    });

    expect(changes).toEqual([10, 20, 30]);
  });

  it('should compute "entry -> a -> b -> observer" chain', async () => {
    const entry = signal(0);

    const a = compute(() => entry() + 1);
    const b = compute(() => a() + 1);

    expect(b()).toEqual(2);

    const changes = await collectChanges(b, async () => {
      entry.set(1);
      expect(b()).toEqual(3);

      await flushMicrotasks();

      entry.set(2);
      expect(b()).toEqual(4);
    });

    expect(changes).toEqual([2, 3, 4]);
  });

  it('should compute a chain: s1 -> a; a + s2 -> b; b -> observer', async () => {
    const s1 = signal(0);
    const s2 = signal(0);

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
    const entry = signal(0);

    const a = compute(() => entry() + 1);
    const b = compute(() => a() + 1);
    const c = compute(() => a() + 1);
    const d = compute(() => b() + c() + 1);

    expect(d()).toEqual(5);

    const changes = await collectChanges(d, async () => {
      entry.set(1);
      expect(d()).toEqual(7);

      await 0;

      entry.set(2);
      expect(d()).toEqual(9);
    });

    expect(changes).toEqual([5, 7, 9]);
  });

  it('should throw an error on a cycle', async () => {
    const entry = signal(0);

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
    const source = createSignalSubject<number>(1);

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
    const store = signal<{ v1: string; v2: string; sum?: string }>(
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
    toObservable(sum).subscribe(onSumChanged);

    await flushMicrotasks();

    expect(onSumChanged).toHaveBeenCalledWith('ab');
    expect(onSumChanged).toHaveBeenCalledTimes(1);

    onSumChanged.mockClear();

    const storeChanges = await collectChanges(store, () => {
      toObservable(sum).subscribe((sum) =>
        store.update((state) => ({ ...state, sum })),
      );
    });

    expect(storeChanges).toEqual([
      { sum: undefined, v1: 'a', v2: 'b' },
      { sum: 'ab', v1: 'a', v2: 'b' },
    ]);
    expect(onSumChanged).toHaveBeenCalledTimes(0);
  });

  it('should handle recursion during store updates: Value selector', async () => {
    const store = signal({ a: 0, result: { value: 0 } });

    const nextResult = compute(() => ({ value: store().a }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = toObservable(nextResult, {
      onlyChanges: true,
    }).subscribe((result) => {
      store.update((state) => ({ ...state, result }));
    });

    const changes = await collectChanges(store, async () => {
      expect(nextResult()).toEqual({ value: 0 });

      store.update((state) => ({ ...state, a: 1 }));

      expect(nextResult()).toEqual({ value: 1 });

      await flushMicrotasks();
    });

    subscription?.unsubscribe();

    expect(changes).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should handle recursion during store updates: Intermediate compute', async () => {
    const store = signal({ a: 0, result: { value: 0 } });

    const a = compute(() => store().a);
    const nextResult = compute(() => ({ value: a() }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = toObservable(nextResult, {
      onlyChanges: true,
    }).subscribe((result) => {
      store.update((state) => ({ ...state, result }));
    });

    const changes = await collectChanges(store, async () => {
      await flushMicrotasks();

      store.update((state) => ({ ...state, a: 1 }));

      await flushMicrotasks();
    });

    subscription?.unsubscribe();

    expect(changes).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should correctly clean tracked effects', async () => {
    const store1 = signal({ a: 0, result: { value: 0 } });

    const nextResult1 = compute(() => ({ value: store1().a }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription1 = toObservable(nextResult1, {}).subscribe((result) => {
      store1.update((state) => ({ ...state, result }));
    });

    await collectChanges(store1, async () => {
      store1.update((state) => ({ ...state, a: 1 }));
    });

    subscription1?.unsubscribe();

    // Expect that the runtime in empty
    expect(SIGNAL_RUNTIME.getTrackedEffects().length).toBe(0);
    expect(SIGNAL_RUNTIME.getVisitedComputedNodes().length).toBe(0);
    expect(SIGNAL_RUNTIME.asyncScheduler.isEmpty()).toBe(true);
    expect(SIGNAL_RUNTIME.syncScheduler.isEmpty()).toBe(true);

    const store = signal({ a: 0, result: { value: 0 } });

    const a = compute(() => store().a);
    const nextResult = compute(() => ({ value: a() }), {
      equal: (a, b) => a.value === b.value,
    });

    const subscription = toObservable(nextResult, {
      onlyChanges: true,
    }).subscribe((result) => {
      store.update((state) => ({ ...state, result }));
    });

    const changes = await collectChanges(store, async () => {
      await flushMicrotasks();
      store.update((state) => ({ ...state, a: 1 }));
    });

    subscription?.unsubscribe();

    expect(changes).toEqual([
      { a: 0, result: { value: 0 } },
      { a: 1, result: { value: 0 } },
      { a: 1, result: { value: 1 } },
    ]);
  });

  it('should use a custom comparator', async () => {
    const source = signal({ key: 1, val: 'a' });

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
    const source = signal({ key: 1, val: 'a' });

    const query = compute(() => source());
    expect(query()).toEqual({ key: 1, val: 'a' });
  });

  it('should do extra computing after reading by an effect', async () => {
    const counter = signal(0);

    // Tracks how many reads of `counter()` there have been.
    let readCount = 0;
    const result = compute(() => {
      readCount++;
      return { value: counter() };
    });

    const result$ = toObservable(result, { sync: true });

    const subscription = result$.subscribe();
    expect(readCount).toBe(1);

    counter.set(1);
    expect(readCount).toBe(2);

    // Should not do extra computing here
    result();
    expect(readCount).toBe(2);

    // Tear down the only subscription.
    subscription.unsubscribe();
  });
});

describe('ComputedImpl()', () => {
  it('should tell about a changed state', () => {
    const source = signal('a');
    const other = signal('something 1');
    const result = new ComputedImpl(() => source(), defaultEquals);

    // Case 1: recalculation is triggered by result.isChanged()
    expect(result.version).toBe(0);

    expect(result.isChanged()).toBe(true);
    expect(result.version).toBe(1);

    expect(result.isChanged()).toBe(true);
    expect(result.version).toBe(1);

    expect(result.signal()).toBe('a');
    expect(result.version).toBe(1);

    // Case 2: recalculation is triggered by result.signal()
    source.set('b');
    expect(result.version).toBe(1);

    expect(result.signal()).toBe('b');
    expect(result.version).toBe(2);

    expect(result.isChanged()).toBe(true);
    expect(result.version).toBe(2);

    expect(result.signal()).toBe('b');
    expect(result.version).toBe(2);

    /*
    Case 3: other signal increases SIGNAL_CLOCK, the result makes recalculation,
    but its value remains the same.
    */
    other.set('something 2');
    expect(result.version).toBe(2);

    expect(result.isChanged()).toBe(false);
    expect(result.version).toBe(2);

    expect(result.signal()).toBe('b');
    expect(result.version).toBe(2);

    expect(result.isChanged()).toBe(false);
    expect(result.version).toBe(2);
  });
});
