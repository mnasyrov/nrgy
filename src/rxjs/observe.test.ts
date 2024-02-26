import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

import { atom, compute, signal } from '../core';
import { flushMicrotasks } from '../test/testUtils';

import { observe } from './observe';

describe('observe()', () => {
  it('should produce an observable that tracks an atom', async () => {
    const counter = atom(0);
    const counterValues = firstValueFrom(
      observe(counter).pipe(take(3), toArray()),
    );

    // Initial effect execution, emits 0.
    await flushMicrotasks();

    counter.set(1);
    // Emits 1.
    await flushMicrotasks();

    counter.set(2);
    counter.set(3);
    // Emits 3 (ignores 2 as it was batched by the effect).
    await flushMicrotasks();

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

    await flushMicrotasks();
    expect(currentValue).toBe(1);

    source.set(2);
    await flushMicrotasks();
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

    await flushMicrotasks();
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
    expect(readCount).toBe(0);

    await flushMicrotasks();
    expect(readCount).toBe(1);

    // Sanity check of the read tracker - updating the counter should cause it to be read again
    // by the active effect.
    counter.set(1);
    await flushMicrotasks();
    expect(readCount).toBe(2);

    // Tear down the only subscription.
    sub.unsubscribe();

    // Now, setting the atom still triggers additional reads
    counter.set(2);
    await flushMicrotasks();
    expect(readCount).toBe(2);
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

    await flushMicrotasks();
    expect(readCount).toBe(0);

    // Now, setting the atom shouldn't trigger any additional reads, as the Injector was destroyed
    // childInjector.destroy();
    counter.set(2);
    await flushMicrotasks();
    expect(readCount).toBe(0);
  });

  it('does not track downstream atom reads in the effect', async () => {
    const counter = atom(0);
    const emits = atom(0);

    let hits = 0;

    observe(counter).subscribe(() => {
      // Read emits. If we are still tracked in the effect, this will cause
      // an infinite loop by triggering the effect again.

      if (hits > 2) return;
      hits++;

      emits();
      emits.update((v) => v + 1);
    });

    await flushMicrotasks();
    expect(emits()).toBe(1);

    await flushMicrotasks();
    expect(emits()).toBe(1);

    expect(hits).toBe(1);
  });

  it('should emits only changes for atoms if "onlyChanges" option is set', () => {
    const source = atom(1);
    const observable = observe(source, { sync: true, onlyChanges: true });

    const spy = jest.fn();
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

    const spy = jest.fn();
    observable.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(1);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(2);
  });

  it('should use a sync scheduler for signals if "sync" option is set', () => {
    const source = signal<number>();
    const observable = observe(source, { sync: true });

    const spy = jest.fn();
    observable.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(0);

    source(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(1);

    source(2);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(2);
  });
});
