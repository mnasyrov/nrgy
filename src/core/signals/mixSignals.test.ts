import { flushMicrotasks } from '../../test/testUtils';
import { atom, effect, mixSignals, signal } from '../index';

describe('mixSignals()', () => {
  it('should be possible mix events of signals in async way', async () => {
    const signalA = signal<number>();
    const signalB = signal<number>();
    const store = atom<number>(0);

    effect(mixSignals([signalA, signalB]), (value) => {
      store.update((prev) => prev + value);
    });

    await flushMicrotasks();
    expect(store()).toBe(0);

    signalA(1);
    await flushMicrotasks();
    expect(store()).toBe(1);

    signalB(2);
    await flushMicrotasks();
    expect(store()).toBe(3);
  });

  it('should be possible mix events of signals in sync way', async () => {
    const signalA = signal<number>();
    const signalB = signal<number>();
    const store = atom<number>(0);

    const mixed = mixSignals([signalA, signalB], { sync: true });
    effect(mixed, (value) => {
      store.update((prev) => prev + value);
    });

    expect(store()).toBe(0);

    signalA(1);
    expect(store()).toBe(1);

    signalB(2);
    expect(store()).toBe(3);
  });
});
