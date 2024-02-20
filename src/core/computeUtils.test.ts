import { atom } from './atom';
import { objectEquals } from './atomUtils';
import { mapAtom, mergeAtoms } from './computeUtils';

describe('mapAtom()', () => {
  it('should follow to map() notation', () => {
    const source = atom(2);
    const result = mapAtom(source, (value) => value * 2);
    expect(result()).toBe(4);
  });

  it('should use a custom "equal" function', () => {
    const source = atom({ foo: 1 });
    const equal = jest.fn(objectEquals);

    const result = mapAtom(source, (value) => ({ foo: value.foo * 2 }), {
      equal,
    });
    const first = result();
    expect(first).toEqual({ foo: 2 });

    source.set({ foo: 1 });
    expect(result()).toBe(first);
    expect(equal).toHaveBeenCalledTimes(1);

    source.set({ foo: 2 });
    expect(result()).toEqual({ foo: 4 });
    expect(equal).toHaveBeenCalledTimes(2);
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

  it('should use a custom "equal" function', () => {
    const equal = jest.fn(objectEquals);

    const source1 = atom({ value: 2 });
    const source2 = atom('text');

    const result = mergeAtoms(
      [source1, source2],
      (a, b) => ({ a: a.value, b }),
      { equal },
    );

    const first = result();
    expect(first).toEqual({ a: 2, b: 'text' });

    source1.set({ value: 2 });
    expect(result()).toBe(first);
    expect(equal).toHaveBeenCalledTimes(1);

    source2.set('text2');
    expect(result()).toEqual({ a: 2, b: 'text2' });
    expect(equal).toHaveBeenCalledTimes(2);
  });
});
