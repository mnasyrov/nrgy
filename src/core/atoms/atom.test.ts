import { AtomUpdateError, getAtomName, getAtomNode, isAtom } from './atom';
import { compute } from './compute';
import { atom } from './writableAtom';

describe('isAtom()', () => {
  it('should return "true" in case a value is Atom', () => {
    expect(isAtom(atom(1))).toBe(true);
    expect(isAtom(atom(1).asReadonly())).toBe(true);
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
    expect(getAtomNode(atom(1).asReadonly())).toBeDefined();
    expect(getAtomNode(compute(() => 1))).toBeDefined();
  });
});

describe('getAtomName()', () => {
  it('should return a name of writable and read-only atoms', () => {
    const namelessAtom = atom(1);
    expect(getAtomName(namelessAtom)).toBe(undefined);

    const namedAtom = atom(1, { name: 'foo' });
    expect(getAtomName(namedAtom)).toBe('foo');

    expect(getAtomName(namedAtom.asReadonly())).toBe('foo');
  });
});

describe('atom()', () => {
  it('should create a value store with the provided initial state', () => {
    const store = atom(1);

    expect(store).toBeInstanceOf(Function);

    expect(store).toEqual(
      expect.objectContaining({
        set: expect.any(Function),
        update: expect.any(Function),
        mutate: expect.any(Function),
        asReadonly: expect.any(Function),
        destroy: expect.any(Function),
      }),
    );

    expect(store()).toEqual(1);
  });
});

describe('AtomUpdateError', () => {
  it("should has correct message for empty atom's name", () => {
    const error = new AtomUpdateError();
    expect(error.message).toBe('Atom cannot be updated in tracked context');
  });

  it("should has correct message for atom's name", () => {
    const error = new AtomUpdateError('atom-name');
    expect(error.message).toBe(
      'Atom cannot be updated in tracked context (atom-name)',
    );
  });
});
