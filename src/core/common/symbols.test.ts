import { ATOM_SYMBOL, SIGNAL_SYMBOL } from './symbols';

describe('Symbol creation', () => {
  test('ATOM_SYMBOL creation', () => {
    expect(Symbol.for('ngry.atom')).toBe(ATOM_SYMBOL);
  });

  test('SIGNAL_SYMBOL creation', () => {
    expect(Symbol.for('ngry.signal')).toBe(SIGNAL_SYMBOL);
  });
});
