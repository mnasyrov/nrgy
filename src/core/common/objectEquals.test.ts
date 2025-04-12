import { objectEquals } from './objectEquals';

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
