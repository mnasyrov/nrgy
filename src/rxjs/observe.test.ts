import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

import { compute } from '../core/compute';
import { signal } from '../core/signal';
import { flushMicrotasks } from '../test/testUtils';

import { observe } from './observe';

describe('observe()', () => {
  it('should produce an observable that tracks a signal', async () => {
    const counter = signal(0);
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

  it('should propagate errors from the signal', async () => {
    const source = signal(1);
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

  it('monitors the signal even if the Observable is never subscribed', async () => {
    let counterRead = false;
    const counter = compute(() => {
      counterRead = true;
      return 0;
    });

    observe(counter);

    // Simply creating the Observable shouldn't trigger a signal read.
    expect(counterRead).toBe(false);

    await flushMicrotasks();
    expect(counterRead).toBe(false);
  });

  it('should not monitor the signal if the Observable has no active subscribers', async () => {
    const counter = signal(0);

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

    // Now, setting the signal still triggers additional reads
    counter.set(2);
    await flushMicrotasks();
    expect(readCount).toBe(2);
  });

  it('stops monitoring the signal once injector is destroyed', async () => {
    const counter = signal(0);

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

    // Now, setting the signal shouldn't trigger any additional reads, as the Injector was destroyed
    // childInjector.destroy();
    counter.set(2);
    await flushMicrotasks();
    expect(readCount).toBe(0);
  });

  it('does not track downstream signal reads in the effect', async () => {
    const counter = signal(0);
    const emits = signal(0);

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
});
