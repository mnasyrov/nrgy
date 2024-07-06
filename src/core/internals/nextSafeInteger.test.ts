import { nextSafeInteger } from './nextSafeInteger';

describe('nextSafeInteger()', () => {
  it('should return an increased value', () => {
    expect(nextSafeInteger(0)).toBe(1);
    expect(nextSafeInteger(1)).toBe(2);
    expect(nextSafeInteger(2)).toBe(3);
  });

  it('should return MIN_SAFE_INTEGER if a current value greater or equal MAX_SAFE_INTEGER', () => {
    expect(nextSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(
      Number.MIN_SAFE_INTEGER,
    );
    expect(nextSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(
      Number.MIN_SAFE_INTEGER,
    );
  });
});
