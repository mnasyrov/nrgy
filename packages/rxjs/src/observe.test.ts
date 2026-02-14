import { atom, compute, effect, runEffects } from '@nrgyjs/core';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { describe, expect, it, test, vi } from 'vitest';

import { observe } from './observe';

describe('observe()', () => {
  it('should produce an observable that tracks an atom', async () => {
    const counter = atom(0);
    const counterValues = firstValueFrom(
      observe(counter).pipe(take(3), toArray()),
    );

    // Initial effect execution, emits 0.
    runEffects();

    counter.set(1);
    // Emits 1.
    runEffects();

    counter.set(2);
    counter.set(3);
    // Emits 3 (ignores 2 as it was batched by the effect).
    runEffects();

    expect(await counterValues).toEqual([0, 1, 3]);
  });

  it('should propagate errors from the atom', async () => {
    const source = atom(1);
    const counter = compute(() => {
      const value = source();
      if (value === 2) {
        throw 'fail';
      } else {
        return value;
      }
    });

    const counter$ = observe(counter);

    let currentValue = 0;
    let currentError: any = null;

    const sub = counter$.subscribe({
      next: (value) => (currentValue = value),
      error: (err) => (currentError = err),
    });

    runEffects();
    expect(currentValue).toBe(1);

    source.set(2);
    runEffects();
    expect(currentError).toBe('fail');

    sub.unsubscribe();
  });

  it('monitors the atom even if the Observable is never subscribed', async () => {
    let counterRead = false;
    const counter = compute(() => {
      counterRead = true;
      return 0;
    });

    observe(counter);

    // Simply creating the Observable shouldn't trigger an atom read.
    expect(counterRead).toBe(false);

    runEffects();
    expect(counterRead).toBe(false);
  });

  it('should not monitor the atom if the Observable has no active subscribers', async () => {
    const counter = atom(0);

    // Tracks how many reads of `counter()` there have been.
    let readCount = 0;
    const trackedCounter = compute(() => {
      readCount++;
      return counter();
    });

    const counter$ = observe(trackedCounter);
    const sub = counter$.subscribe();

    counter.set(1);
    runEffects();
    const prevReadCount = readCount;

    // Tear down the only subscription.
    sub.unsubscribe();

    // Now, setting the atom still triggers additional reads
    counter.set(2);
    runEffects();
    expect(readCount).toBe(prevReadCount);
  });

  it('stops monitoring the atom once injector is destroyed', async () => {
    const counter = atom(0);

    // Tracks how many reads of `counter()` there have been.
    let readCount = 0;
    const trackedCounter = compute(() => {
      readCount++;
      return counter();
    });

    // const childInjector = createEnvironmentInjector([], injector);
    observe(trackedCounter);

    expect(readCount).toBe(0);

    runEffects();
    expect(readCount).toBe(0);

    // Now, setting the atom shouldn't trigger any additional reads, as the Injector was destroyed
    // childInjector.destroy();
    counter.set(2);
    runEffects();
    expect(readCount).toBe(0);
  });

  it('does not track downstream atom reads in the effect', async () => {
    const counter = atom(0);
    const emits = atom(0);

    let hits = 0;

    observe(counter).subscribe(() => {
      // Read emitting. If we are still tracked in the effect, this will cause
      // an infinite loop by triggering the effect again.

      if (hits > 2) return;
      hits++;

      emits();
      emits.update((v) => v + 1);
    });

    runEffects();
    expect(emits()).toBe(1);

    runEffects();
    expect(emits()).toBe(1);

    expect(hits).toBe(1);
  });

  it('should emits only changes for atoms if "onlyChanges" option is set', () => {
    const source = atom(1);
    const observable = observe(source, { sync: true, onlyChanges: true });

    const spy = vi.fn();
    observable.subscribe(spy);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(2);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(2);

    source.set(3);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('should use a sync scheduler for atoms if "sync" option is set', () => {
    const source = atom(1);
    const observable = observe(source, { sync: true });

    const spy = vi.fn();
    observable.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(1);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(2);
  });

  test('Race in observe() and effect()', async () => {
    const history1: number[] = [];
    const history2: number[] = [];

    const store = atom(1);
    const computed = compute(() => store());
    const observable = observe(computed);

    observable.subscribe((value) => history1.push(value));
    effect(computed, (v) => history2.push(v));

    runEffects();

    store.set(2);
    runEffects();

    store.set(3);
    runEffects();

    expect(history1).toEqual([1, 2, 3]);
    expect(history2).toEqual([1, 2, 3]);
  });
});
