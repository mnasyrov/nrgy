import { atom, compute, getAtomLabel, getAtomNode, isAtom } from './reactivity';

describe('isAtom()', () => {
  it('should return "true" in case a value is Atom', () => {
    expect(isAtom(atom(1))).toBe(true);
    expect(isAtom(compute(() => 1))).toBe(true);

    expect(isAtom(undefined)).toBe(false);
    expect(isAtom(null)).toBe(false);
    expect(isAtom(1)).toBe(false);
    expect(isAtom('2')).toBe(false);
    expect(isAtom(NaN)).toBe(false);
    expect(isAtom({})).toBe(false);
  });
});

describe('getAtomNode()', () => {
  it('should return an internal AtomNode of the atom', () => {
    expect(getAtomNode(atom(1))).toBeDefined();
    expect(getAtomNode(compute(() => 1))).toBeDefined();
  });
});

describe('getAtomName()', () => {
  it('should return a name of writable and read-only atoms', () => {
    const namelessAtom = atom(1);
    expect(getAtomLabel(namelessAtom)).toBe(undefined);

    const namedAtom = atom(1, { label: 'foo' });
    expect(getAtomLabel(namedAtom)).toBe('foo');
  });
});
