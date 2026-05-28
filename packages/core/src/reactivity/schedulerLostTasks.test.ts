import { describe, expect, test } from 'vitest';
import { flushMicrotasks } from '../internals/test/flushMicrotasks';
import { atom, effect } from './reactivity';

describe('Async scheduler does not lose tasks when ring buffer wraps and grows', () => {
  test('33 effects scheduled after queue wrapped — all should fire', async () => {
    // Warm the scheduler so head > 0 after drain.
    const warmAtom = atom(0);
    for (let i = 0; i < 10; i++) {
      const e = effect(warmAtom, () => {});
      // Just trigger; we'll let microtasks flush which moves head forward
      e; // keep reference
    }
    await flushMicrotasks();
    // Drain again
    warmAtom.set(1);
    await flushMicrotasks();

    // Now schedule 33+ effects simultaneously
    const trigger = atom(0);
    const fired = new Array<boolean>(40).fill(false);
    for (let i = 0; i < 40; i++) {
      effect(trigger, () => {
        fired[i] = true;
      });
    }

    await flushMicrotasks();
    await flushMicrotasks();

    for (let i = 0; i < 40; i++) {
      expect(fired[i], `effect ${i} should have fired`).toBe(true);
    }
  });

  test('many sets and effects scheduled — no lost notifications under wrapping', async () => {
    const sink = atom(0);
    // Pre-warm to move head
    for (let i = 0; i < 50; i++) {
      sink.set(i);
      await flushMicrotasks();
    }

    const source = atom<number>(-1);
    const observed: number[] = [];

    effect(source, (v) => observed.push(v));

    // Schedule many sets while also creating new effects
    for (let i = 0; i < 50; i++) {
      effect(source, () => {});
    }
    source.set(100);

    await flushMicrotasks();
    await flushMicrotasks();

    expect(observed[observed.length - 1]).toBe(100);
  });
});
