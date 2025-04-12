import { AtomUpdateError } from './atomUpdateError';

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
