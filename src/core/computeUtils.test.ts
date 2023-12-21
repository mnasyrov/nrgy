import { atom } from './atom';
import { mapAtom, mergeAtoms } from './computeUtils';

describe('mapAtom()', () => {
  it('should follow to map() notation', () => {
    const source = atom(2);
    const result = mapAtom(source, (value) => value * 2);
    expect(result()).toBe(4);
  });
});

describe('mergeQueries()', () => {
  it('should return a calculated value from source queries', () => {
    const source1 = atom(2);
    const source2 = atom('text');

    const result = mergeAtoms([source1, source2], (a, b) => ({ a, b }));

    expect(result()).toEqual({ a: 2, b: 'text' });

    source1.set(3);
    expect(result()).toEqual({ a: 3, b: 'text' });

    source2.set('text2');
    expect(result()).toEqual({ a: 3, b: 'text2' });
  });
});
