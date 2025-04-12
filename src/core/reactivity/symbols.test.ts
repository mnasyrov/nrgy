import { ATOM_SYMBOL } from './symbols';

describe('Symbol creation', () => {
  test('ATOM_SYMBOL creation', () => {
    expect(Symbol.for('ngry.atom')).toBe(ATOM_SYMBOL);
  });
});
