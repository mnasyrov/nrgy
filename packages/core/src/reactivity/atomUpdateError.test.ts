import { describe, expect, it } from 'vitest';
import { AtomUpdateError } from './reactivity';

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
