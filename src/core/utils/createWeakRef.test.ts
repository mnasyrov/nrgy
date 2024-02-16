import { createWeakRef } from './createWeakRef';

describe('createWeakRef()', () => {
  it('should be a seamless factory to create a WeakRef instance if WeakRef is defined', () => {
    const obj = {};
    const ref = createWeakRef(obj);

    expect(ref.deref()).toBe(obj);
    expect(ref).toBeInstanceOf(WeakRef);
    expect(ref.toString()).toBe('[object WeakRef]');
  });
});
