import { flushMicrotasks } from '../test/testUtils';

import {
  atom,
  destroySignal,
  effect,
  keepLastValue,
  signal,
  signalChanges,
  syncEffect,
} from './index';

describe('keepSignalValue()', () => {
  it('should return an atom which remembers the last emitter value using sync explicitly ', () => {
    const source = signal<number>();

    const lastValue = keepLastValue(source, 0, { sync: true });
    expect(lastValue()).toBe(0);

    source(1);
    expect(lastValue()).toBe(1);
  });

  it('should return an atom which remembers the last emitter value using  async scheduler explicitly ', async () => {
    const source = signal<number>();

    const lastValue = keepLastValue(source, 0, { sync: false });
    expect(lastValue()).toBe(0);

    source(1);
    expect(lastValue()).toBe(0);

    await flushMicrotasks();
    expect(lastValue()).toBe(1);
  });

  it('should return an atom which remembers the last emitter value using async scheduler by default', async () => {
    const source = signal<number>();

    const lastValue = keepLastValue(source, 0);
    expect(lastValue()).toBe(0);

    source(1);
    expect(lastValue()).toBe(0);

    await flushMicrotasks();
    expect(lastValue()).toBe(1);
  });
});

describe('signalChanges()', () => {
  it('should return a signal that synchronously emits the changes of the source atom', () => {
    const source = atom(1);

    const changes = signalChanges(source, { sync: true });

    const spy = jest.fn();
    syncEffect(changes, spy);
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(2);
    expect(spy).toHaveBeenLastCalledWith(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    source.set(2);
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(3);
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('should return a signal that asynchronously emits the changes of the source atom', async () => {
    const source = atom(1);

    const changes = signalChanges(source);

    const spy = jest.fn();
    effect(changes, spy);
    await flushMicrotasks();
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(2);
    await flushMicrotasks();
    expect(spy).toHaveBeenLastCalledWith(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    source.set(2);
    await flushMicrotasks();
    expect(spy).toHaveBeenCalledTimes(0);

    source.set(3);
    await flushMicrotasks();
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('should return a signal that does not emit the changes if the source atom is destroyed', () => {
    const spy = jest.fn();
    const source = atom(1);

    const changes = signalChanges(source, { sync: true });
    syncEffect(changes, spy);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    source.destroy();
    source.set(3);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should return a signal that does not emit the changes if the signal is destroyed', () => {
    const spy = jest.fn();
    const source = atom(1);

    const changes = signalChanges(source, { sync: true });
    syncEffect(changes, spy);

    source.set(2);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    destroySignal(changes);
    source.set(3);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should return a signal that calls onDestroy callback if the signal is destroyed', () => {
    const onDestroy = jest.fn();
    const source = atom(1);

    const changes = signalChanges(source, { onDestroy });

    destroySignal(changes);
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });
});
