import * as mockedModule from './createWeakMap';
import { createWeakMap } from './createWeakMap';

jest.mock('./createWeakMap', () => {
  const originalWeakMapConstructor = (globalThis as any).WeakMap;
  (globalThis as any).WeakMap = undefined;

  const originalModule = jest.requireActual('./createWeakMap');

  return {
    __esModule: true,
    ...originalModule,
    originalWeakMapConstructor,
  };
});

describe('createWeakMap() polyfill', () => {
  it('should creates an instance of LeakMap polyfill if WeakMap is not available', () => {
    const key = {};
    const obj = {};

    const map = createWeakMap();

    map.set(key, obj);
    expect(map.has(key)).toBe(true);
    expect(map.get(key)).toBe(obj);

    expect(map.delete(key)).toBe(true);
    expect(map.delete(key)).toBe(false);
    expect(map.has(key)).toBe(false);
    expect(map.get(key)).toBe(undefined);

    expect(map).not.toBeInstanceOf(
      (mockedModule as any).originalWeakMapConstructor,
    );
    expect(map.toString()).toBe('[object LeakyMap]');
  });
});
