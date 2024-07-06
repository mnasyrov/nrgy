import { atom } from '../atoms/writableAtom';

import { mapAtom } from './mapAtom';
import { objectEquals } from './objectEquals';

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
