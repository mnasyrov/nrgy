import { describe, expect, test } from 'vitest';
import { flushMicrotasks } from '../internals/test/flushMicrotasks';
import { atom, effect, RUNTIME } from './reactivity';

describe('Async scheduler: resume after pause must drain pending tasks', () => {
  test('tasks scheduled during a batch run after batch resumes', async () => {
    const source = atom(0);
    const observed: number[] = [];

    effect(source, (v) => observed.push(v));
    await flushMicrotasks();
    observed.length = 0;

    RUNTIME.batch(() => {
      source.set(1);
      // The batch pauses schedulers; the effect is scheduled but paused.
    });
    // After batch, resume runs. The pending effect must fire.

    await flushMicrotasks();

    expect(observed).toEqual([1]);
  });

  test('resume() after a scheduled microtask drained while paused must still drain queue', async () => {
    // Direct test of the createMicrotaskScheduler resume() bug.
    // Steps that hit it: pause -> schedule (queues a microtask) ->
    // microtask fires while still paused -> resume() must re-run execute().
    const source = atom(0);
    const observed: number[] = [];
    effect(source, (v) => observed.push(v));
    await flushMicrotasks();
    observed.length = 0;

    // Manually drive the scheduler state to hit the bug.
    RUNTIME.asyncScheduler.pause();
    source.set(1); // schedules an effect; isPlanned -> true, queues microtask

    // Let the microtask fire while paused. The execute() body sees
    // isPaused=true and exits, leaving the task in queue and isPlanned=false.
    await Promise.resolve();
    await Promise.resolve();

    RUNTIME.asyncScheduler.resume();
    await flushMicrotasks();

    expect(observed).toEqual([1]);
  });
});
