import { keepLastValue, signal } from '../index';

describe('keepLastValue()', () => {
  it('should return an atom which remembers the last emitter value ', () => {
    const source = signal<number>();

    const lastValue = keepLastValue(source, 0);
    expect(lastValue()).toBe(0);

    source(1);
    expect(lastValue()).toBe(1);
  });
});
