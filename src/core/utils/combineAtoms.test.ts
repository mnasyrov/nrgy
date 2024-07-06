import { atom } from '../atoms/writableAtom';

import { combineAtoms } from './combineAtoms';

describe('combineAtoms()', () => {
  it('should return a list of source values', () => {
    const s1 = atom(2);
    const s2 = atom('text');

    const result = combineAtoms([s1, s2]);

    expect(result()).toEqual([2, 'text']);

    s1.set(3);
    expect(result()).toEqual([3, 'text']);

    s2.set('text2');
    expect(result()).toEqual([3, 'text2']);
  });

  it('should use a custom "equal" function', () => {
    const s1 = atom(1);
    const s2 = atom('text');

    const equal = jest.fn((a, b) => a[0] === b[0]);
    const result = combineAtoms([s1, s2], { equal });

    const first = result();
    expect(first).toEqual([1, 'text']);

    s2.set('text2');
    expect(result()).toBe(first);
    expect(equal).toHaveBeenCalledTimes(1);

    s1.set(2);
    expect(result()).toEqual([2, 'text2']);
    expect(equal).toHaveBeenCalledTimes(2);
  });
});
