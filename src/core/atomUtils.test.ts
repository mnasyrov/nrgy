import { defaultEquals, objectEquals } from './atomUtils';

describe('defaultEquals()', () => {
  it('should compare values using identity semantics', () => {
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

describe('objectEquals()', () => {
  it('should compare properties of objects', () => {
    const obj = { a: 1 };

    expect(objectEquals({}, {})).toBe(true);
    expect(objectEquals(obj, obj)).toBe(true);
    expect(objectEquals({ a: 1 }, {})).toBe(false);
    expect(objectEquals({}, { a: 1 })).toBe(false);
    expect(objectEquals({ a: 1 }, { a: 1 })).toBe(true);
    expect(objectEquals({ a: 1 }, { a: 2 })).toBe(false);
    expect(objectEquals({ a: 1 }, { a: 1, b: 3 })).toBe(false);
    expect(objectEquals({ a: 1 }, { b: 1 })).toBe(false);
    expect(objectEquals({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });
});
