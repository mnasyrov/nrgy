import * as mockedModule from './queueMicrotask';
import { nrgyQueueMicrotask } from './queueMicrotask';

jest.mock('./queueMicrotask', () => {
  const originalValue = (globalThis as any).queueMicrotask;
  (globalThis as any).queueMicrotask = undefined;

  const originalModule = jest.requireActual('./queueMicrotask');

  return {
    __esModule: true,
    ...originalModule,
    originalValue,
  };
});

describe('nrgyQueueMicrotask() polyfill', () => {
  it('should schedule a microtask to the event loop', async () => {
    expect(nrgyQueueMicrotask).not.toBe((mockedModule as any).originalValue);

    const results: number[] = [];

    setTimeout(() => results.push(1), 0);
    nrgyQueueMicrotask(() => results.push(2));
    setTimeout(() => results.push(3), 20);
    nrgyQueueMicrotask(() => results.push(4));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(results).toEqual([2, 4, 1, 3]);
  });
});
