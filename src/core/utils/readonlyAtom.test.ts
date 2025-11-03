import { atom } from '../reactivity/atom';
import { getAtomLabel, isAtom } from '../reactivity/atomUtils';
import { syncEffect } from '../reactivity/effect';

import { readonlyAtom } from './readonlyAtom';

describe('readonlyAtom()', () => {
  it('should return a read-only representation of the writable Atom', () => {
    const source = atom(1);
    const readonly = readonlyAtom(source);

    expect(readonly).toBeInstanceOf(Function);
    expect(isAtom(readonly)).toBe(true);
    expect(readonly()).toBe(1);

    expect(readonly).not.toEqual(
      expect.objectContaining({
        set: expect.any(Function),
        update: expect.any(Function),
        mutate: expect.any(Function),
        destroy: expect.any(Function),
      }),
    );

    expect(readonly()).toEqual(1);

    source.set(2);
    expect(readonly()).toEqual(2);
  });

  it('should return a name of the source atom', () => {
    const namedAtom = atom(1, { label: 'foo' });
    expect(getAtomLabel(namedAtom)).toBe('foo');

    const readonly = readonlyAtom(namedAtom);
    expect(getAtomLabel(readonly)).toBe('foo');
  });

  test('Read-only atom should transmit "destroy" notification', () => {
    const source = atom(1);
    const readonly = readonlyAtom(source);

    const destroyCallback = jest.fn();
    syncEffect(readonly, () => {}, { onDestroy: destroyCallback });

    source.destroy();
    expect(destroyCallback).toHaveBeenCalledTimes(1);
  });
});
