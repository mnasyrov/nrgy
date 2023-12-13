import { keepLastValue, signal } from './_public';

describe('keepSignalValue()', () => {
  it('should return an atom which remembers the last emitter value', () => {
    const source = signal<number>();

    const lastValue = keepLastValue(source, 0, { sync: true });
    expect(lastValue()).toBe(0);

    source(1);
    expect(lastValue()).toBe(1);
  });
});
