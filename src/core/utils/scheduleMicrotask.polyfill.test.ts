import * as mockedModule from './scheduleMicrotask';
import { scheduleMicrotask } from './scheduleMicrotask';

jest.mock('./scheduleMicrotask', () => {
  const originalValue = (globalThis as any).queueMicrotask;
  (globalThis as any).queueMicrotask = undefined;

  const originalModule = jest.requireActual('./scheduleMicrotask');

  return {
    __esModule: true,
    ...originalModule,
    originalValue,
  };
});

describe('scheduleMicrotask() polyfill', () => {
  it('should schedule a microtask to the event loop', async () => {
    expect(scheduleMicrotask).not.toBe((mockedModule as any).originalValue);

    const results: number[] = [];

    setTimeout(() => results.push(1), 0);
    scheduleMicrotask(() => results.push(2));
    setTimeout(() => results.push(3), 20);
    scheduleMicrotask(() => results.push(4));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(results).toEqual([2, 4, 1, 3]);
  });
});
