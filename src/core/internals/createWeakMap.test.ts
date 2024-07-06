import { createWeakMap } from './createWeakMap';

describe('createWeakMap()', () => {
  it('should be a seamless factory to create a WeakMap instance if WeakMap is defined', () => {
    const key = {};
    const obj = {};

    const map = createWeakMap();
    map.set(key, obj);

    expect(map.get(key)).toBe(obj);
    expect(map).toBeInstanceOf(WeakMap);
    expect(map.toString()).toBe('[object WeakMap]');
  });
});
