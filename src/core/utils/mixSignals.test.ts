import { flushMicrotasks } from '../../test/testUtils';
import {
  atom,
  destroySignal,
  effect,
  isSignalDestroyed,
  isSignalSubscribed,
  mixSignals,
  signal,
} from '../index';

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

  it('should calls callback which are provided by SignalOptions', () => {
    const onSubscribe = jest.fn();
    const onEvent = jest.fn();
    const onUnsubscribe = jest.fn();
    const onDestroy = jest.fn();

    const source = signal<number>();
    const mixed = mixSignals([source], {
      sync: true,
      onSubscribe,
      onEvent,
      onUnsubscribe,
      onDestroy,
    });

    source(0);
    expect(onEvent).toHaveBeenCalledTimes(0);

    const fx = effect(mixed, () => {});
    expect(onSubscribe).toHaveBeenCalledTimes(1);

    source(1);
    expect(onEvent).toHaveBeenCalledTimes(1);

    fx.destroy();
    expect(onUnsubscribe).toHaveBeenCalledTimes(1);

    destroySignal(mixed);
    expect(onDestroy).toHaveBeenCalledTimes(1);

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).toHaveBeenCalledTimes(1); // ?
    expect(onDestroy).toHaveBeenCalledTimes(1);
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

  it('should manage internal effects corresponding to a subscription state of the result signal', () => {
    const a = signal<number>();
    const b = signal<number>();

    const mixed = mixSignals([a, b]);
    expect(isSignalSubscribed(a)).toBe(false);
    expect(isSignalSubscribed(b)).toBe(false);
    expect(isSignalSubscribed(mixed)).toBe(false);

    const fx1 = effect(mixed, () => {});
    expect(isSignalSubscribed(a)).toBe(true);
    expect(isSignalSubscribed(b)).toBe(true);
    expect(isSignalSubscribed(mixed)).toBe(true);

    const fx2 = effect(mixed, () => {});
    expect(isSignalSubscribed(a)).toBe(true);
    expect(isSignalSubscribed(b)).toBe(true);
    expect(isSignalSubscribed(mixed)).toBe(true);

    fx2.destroy();
    expect(isSignalSubscribed(a)).toBe(true);
    expect(isSignalSubscribed(b)).toBe(true);
    expect(isSignalSubscribed(mixed)).toBe(true);

    fx1.destroy();
    expect(isSignalSubscribed(a)).toBe(false);
    expect(isSignalSubscribed(b)).toBe(false);
    expect(isSignalSubscribed(mixed)).toBe(false);
  });

  it('should unsubscribe internal effects on destruction', () => {
    const a = signal<number>();
    const b = signal<number>();

    const mixed = mixSignals([a, b]);
    effect(mixed, () => {});
    expect(isSignalSubscribed(a)).toBe(true);
    expect(isSignalSubscribed(b)).toBe(true);
    expect(isSignalSubscribed(mixed)).toBe(true);

    destroySignal(mixed);
    expect(isSignalSubscribed(a)).toBe(false);
    expect(isSignalSubscribed(b)).toBe(false);
    expect(isSignalSubscribed(mixed)).toBe(false);

    expect(isSignalDestroyed(a)).toBe(false);
    expect(isSignalDestroyed(b)).toBe(false);
    expect(isSignalDestroyed(mixed)).toBe(true);
  });
});
