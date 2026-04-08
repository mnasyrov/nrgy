import { atom, compute, runEffects } from '@nrgyjs/core';
import type { Subscription } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { observe } from './observe';

function expectEveryCount(
  counts: Uint8Array | Uint16Array,
  expected: number,
): void {
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] !== expected) {
      throw new Error(
        `Expected counts[${i}] to be ${expected}, got ${counts[i]}`,
      );
    }
  }
}

function expectEveryValue(values: Int32Array, expected: number): void {
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== expected) {
      throw new Error(
        `Expected values[${i}] to be ${expected}, got ${values[i]}`,
      );
    }
  }
}

describe('observe() additional subscription coverage', () => {
  it('shares one source subscription and replays cached values without extra reads', () => {
    const source = atom(0);
    let readCount = 0;

    const tracked = compute(() => {
      readCount++;
      return source();
    });

    const observable = observe(tracked);

    const history1: number[] = [];
    const history2: number[] = [];
    const history3: number[] = [];

    const sub1 = observable.subscribe((value) => history1.push(value));
    const sub2 = observable.subscribe((value) => history2.push(value));

    runEffects();

    expect(history1).toEqual([0]);
    expect(history2).toEqual([0]);
    expect(readCount).toBe(1);

    sub1.unsubscribe();
    source.set(1);
    runEffects();

    expect(history1).toEqual([0]);
    expect(history2).toEqual([0, 1]);
    expect(readCount).toBe(2);

    const readCountBeforeReplay = readCount;
    const sub3 = observable.subscribe((value) => history3.push(value));

    expect(history3).toEqual([1]);
    expect(readCount).toBe(readCountBeforeReplay);

    source.set(2);
    runEffects();

    expect(history2).toEqual([0, 1, 2]);
    expect(history3).toEqual([1, 2]);
    expect(readCount).toBe(3);

    sub2.unsubscribe();
    sub3.unsubscribe();

    source.set(3);
    runEffects();

    expect(readCount).toBe(3);
  });

  it('keeps remaining subscribers alive when one unsubscribes from next callback', () => {
    const source = atom(0);
    const observable = observe(source);

    const history1: number[] = [];
    const history2: number[] = [];

    let sub1: Subscription | undefined;
    sub1 = observable.subscribe((value) => {
      history1.push(value);

      if (value === 0) {
        sub1?.unsubscribe();
      }
    });

    const sub2 = observable.subscribe((value) => history2.push(value));

    runEffects();

    source.set(1);
    runEffects();

    source.set(2);
    runEffects();

    expect(history1).toEqual([0]);
    expect(history2).toEqual([0, 1, 2]);

    sub2.unsubscribe();
  });

  it('replays the latest value exactly once to a subscriber created from another listener', () => {
    const source = atom(0);
    let readCount = 0;

    const tracked = compute(() => {
      readCount++;
      return source();
    });

    const observable = observe(tracked);

    const outerHistory: number[] = [];
    const innerHistory: number[] = [];

    let innerSub: Subscription | undefined;
    const outerSub = observable.subscribe((value) => {
      outerHistory.push(value);

      if (value === 0 && !innerSub) {
        innerSub = observable.subscribe((innerValue) =>
          innerHistory.push(innerValue),
        );
      }
    });

    runEffects();

    expect(outerHistory).toEqual([0]);
    expect(innerHistory).toEqual([0]);
    expect(readCount).toBe(1);

    source.set(1);
    runEffects();

    expect(outerHistory).toEqual([0, 1]);
    expect(innerHistory).toEqual([0, 1]);
    expect(readCount).toBe(2);

    innerSub?.unsubscribe();
    outerSub.unsubscribe();
  });

  it('completes all subscribers when the source is destroyed from a listener', () => {
    const source = atom(0);
    const observable = observe(source);

    const history1: number[] = [];
    const history2: number[] = [];
    const complete1 = vi.fn();
    const complete2 = vi.fn();

    const sub1 = observable.subscribe({
      next: (value) => {
        history1.push(value);

        if (value === 1) {
          source.destroy();
        }
      },
      complete: complete1,
    });

    const sub2 = observable.subscribe({
      next: (value) => history2.push(value),
      complete: complete2,
    });

    runEffects();

    source.set(1);
    runEffects();

    expect(history1).toEqual([0, 1]);
    expect(history2).toEqual([0, 1]);
    expect(complete1).toHaveBeenCalledTimes(1);
    expect(complete2).toHaveBeenCalledTimes(1);

    source.set(2);
    runEffects();

    expect(history1).toEqual([0, 1]);
    expect(history2).toEqual([0, 1]);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });

  it('resets onlyChanges state after the last subscriber unsubscribes', () => {
    const source = atom(0);
    const observable = observe(source, { sync: true, onlyChanges: true });

    const history1: number[] = [];
    const history2: number[] = [];
    const history3: number[] = [];

    const sub1 = observable.subscribe((value) => history1.push(value));

    source.set(1);

    const sub2 = observable.subscribe((value) => history2.push(value));

    expect(history2).toEqual([]);

    source.set(2);

    expect(history1).toEqual([1, 2]);
    expect(history2).toEqual([2]);

    sub1.unsubscribe();
    sub2.unsubscribe();

    const sub3 = observable.subscribe((value) => history3.push(value));

    expect(history3).toEqual([]);

    source.set(3);

    expect(history3).toEqual([3]);

    sub3.unsubscribe();
  });

  it('handles 10000 subscribers to one shared observable without duplicate source reads', () => {
    const source = atom(0);
    let readCount = 0;

    const tracked = compute(() => {
      readCount++;
      return source();
    });

    const observable = observe(tracked);
    const subscriberCount = 10_000;
    const callCounts = new Uint8Array(subscriberCount);

    const subscriptions = Array.from({ length: subscriberCount }, (_, index) =>
      observable.subscribe(() => {
        callCounts[index]++;
      }),
    );

    runEffects();

    expect(readCount).toBe(1);
    expectEveryCount(callCounts, 1);

    source.set(1);
    runEffects();

    expect(readCount).toBe(2);
    expectEveryCount(callCounts, 2);

    subscriptions.forEach((subscription) => subscription.unsubscribe());

    source.set(2);
    runEffects();

    expect(readCount).toBe(2);
    expectEveryCount(callCounts, 2);
  });

  it('handles 10000 independent observe() subscriptions on the same atom', () => {
    const source = atom(0);
    const subscriberCount = 10_000;
    const callCounts = new Uint8Array(subscriberCount);
    const lastValues = new Int32Array(subscriberCount);

    const subscriptions = Array.from({ length: subscriberCount }, (_, index) =>
      observe(source, { sync: true }).subscribe((value) => {
        callCounts[index]++;
        lastValues[index] = value;
      }),
    );

    expectEveryCount(callCounts, 1);
    expectEveryValue(lastValues, 0);

    source.set(1);

    expectEveryCount(callCounts, 2);
    expectEveryValue(lastValues, 1);

    subscriptions.forEach((subscription) => subscription.unsubscribe());

    source.set(2);

    expectEveryCount(callCounts, 2);
    expectEveryValue(lastValues, 1);
  });

  it('allows a listener to subscribe to another atom and mutate it immediately', () => {
    const source = atom(0);
    const nested = atom(10);

    const sourceHistory: number[] = [];
    const nestedHistory: number[] = [];

    let nestedSub: Subscription | undefined;
    const sourceSub = observe(source).subscribe((value) => {
      sourceHistory.push(value);

      if (value === 0 && !nestedSub) {
        nestedSub = observe(nested, { sync: true }).subscribe((nestedValue) =>
          nestedHistory.push(nestedValue),
        );

        nested.set(11);
        nested.update((nestedValue) => nestedValue + 1);
      }
    });

    runEffects();

    expect(sourceHistory).toEqual([0]);
    expect(nestedHistory).toEqual([10, 11, 12]);

    nested.set(13);

    expect(nestedHistory).toEqual([10, 11, 12, 13]);

    source.set(1);
    runEffects();

    expect(sourceHistory).toEqual([0, 1]);
    expect(nestedHistory).toEqual([10, 11, 12, 13]);

    nestedSub?.unsubscribe();
    sourceSub.unsubscribe();
  });

  it('keeps sibling sync observe subscriptions alive during nested subscriptions and target updates', () => {
    const source = atom(0);
    const nested = atom(0);

    const sourceHistory1: number[] = [];
    const sourceHistory2: number[] = [];
    const nestedHistory1: number[] = [];
    const nestedHistory2: number[] = [];

    const nestedSub1 = observe(nested, { sync: true }).subscribe(
      (nestedValue) => {
        nestedHistory1.push(nestedValue);
      },
    );

    let nestedSub: Subscription | undefined;
    const sourceSub1 = observe(source, { sync: true }).subscribe((value) => {
      sourceHistory1.push(value);

      if (value === 1 && !nestedSub) {
        nestedSub = observe(nested, { sync: true }).subscribe((nestedValue) =>
          nestedHistory2.push(nestedValue),
        );

        nested.set(1);
        nested.set(2);
      }
    });

    const sourceSub2 = observe(source, { sync: true }).subscribe((value) => {
      sourceHistory2.push(value);
    });

    expect(sourceHistory1).toEqual([0]);
    expect(sourceHistory2).toEqual([0]);

    source.set(1);

    expect(sourceHistory1).toEqual([0, 1]);
    expect(sourceHistory2).toEqual([0, 1]);
    expect(nestedHistory1).toEqual([0, 2]);
    expect(nestedHistory2).toEqual([2]);

    source.set(2);

    expect(sourceHistory1).toEqual([0, 1, 2]);
    expect(sourceHistory2).toEqual([0, 1, 2]);

    nestedSub?.unsubscribe();
    nestedSub1.unsubscribe();
    sourceSub1.unsubscribe();
    sourceSub2.unsubscribe();
  });
});
