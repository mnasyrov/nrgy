import * as mockedModule from './createWeakRef';
import { createWeakRef } from './createWeakRef';

jest.mock('./createWeakRef', () => {
  const originalWeakRefConstructor = (globalThis as any).WeakRef;
  (globalThis as any).WeakRef = undefined;

  const originalModule = jest.requireActual('./createWeakRef');

  return {
    __esModule: true,
    ...originalModule,
    originalWeakRefConstructor,
  };
});

describe('createWeakRef() polyfill', () => {
  it('should creates an instance of LeakRef polyfill if WeakRef is not available', () => {
    const obj = {};
    const ref = createWeakRef(obj);

    expect(ref.deref()).toBe(obj);
    expect(ref).not.toBeInstanceOf(
      (mockedModule as any).originalWeakRefConstructor,
    );
    expect(ref.toString()).toBe('[object LeakyRef]');
  });
});
