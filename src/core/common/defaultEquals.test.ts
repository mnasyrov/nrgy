import { defaultEquals } from './defaultEquals';

describe('defaultEquals()', () => {
  it('should compare values using identity semantics', () => {
    expect(defaultEquals(true, true)).toBe(true);
    expect(defaultEquals(true, false)).toBe(false);
    expect(defaultEquals(false, true)).toBe(false);
    expect(defaultEquals(false, false)).toBe(true);

    expect(defaultEquals(1, 1)).toBe(true);
    expect(defaultEquals('a', 'a')).toBe(true);
    expect(defaultEquals('1', 1)).toBe(false);
    expect(defaultEquals(null, null)).toBe(true);
    expect(defaultEquals(undefined, null)).toBe(false);
    expect(defaultEquals(undefined, undefined)).toBe(true);
    expect(defaultEquals({}, {})).toBe(false);
    expect(defaultEquals(NaN, NaN)).toBe(true);
    expect(defaultEquals(Infinity, Infinity)).toBe(true);
    expect(defaultEquals(-Infinity, -Infinity)).toBe(true);
    expect(defaultEquals(Infinity, -Infinity)).toBe(false);
  });
});
