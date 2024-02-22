import { nrgyQueueMicrotask, queueMicrotaskPolyfill } from './queueMicrotask';

describe('nrgyQueueMicrotask()', () => {
  it('should schedule a microtask to the event loop', async () => {
    const results: number[] = [];

    setTimeout(() => results.push(1), 0);
    nrgyQueueMicrotask(() => results.push(2));
    setTimeout(() => results.push(3), 20);
    nrgyQueueMicrotask(() => results.push(4));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(results).toEqual([2, 4, 1, 3]);
  });
});

describe('queueMicrotaskPolyfill()', () => {
  it('should schedule a microtask to the event loop', async () => {
    const results: number[] = [];

    setTimeout(() => results.push(1), 0);
    queueMicrotaskPolyfill(() => results.push(2));
    setTimeout(() => results.push(3), 20);
    queueMicrotaskPolyfill(() => results.push(4));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(results).toEqual([2, 4, 1, 3]);
  });
});
