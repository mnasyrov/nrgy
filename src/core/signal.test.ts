import { flushMicrotasks } from '../test/testUtils';

import { effect, syncEffect } from './effect';
import { destroySignal, getSignalName, getSignalNode, signal } from './signal';

describe('getSignalName()', () => {
  it('should return a name of writable and read-only atoms', () => {
    const namelessSignal = signal();
    expect(getSignalName(namelessSignal)).toBe(undefined);

    const namedSignal = signal({ name: 'foo' });
    expect(getSignalName(namedSignal)).toBe('foo');
  });
});

describe('signal()', () => {
  it('should return an event emitter', async () => {
    const a = signal<number>();

    let result;
    effect(a, (value) => (result = value));
    a(1);

    await flushMicrotasks();
    expect(result).toBe(1);
  });

  it('should use void type and undefined value if a generic type is not specified', async () => {
    const a = signal();

    let count = 0;
    effect(a, () => count++);
    a();

    await flushMicrotasks();
    expect(count).toBe(1);
  });

  it('should not emit a value if it is destroyed', () => {
    const callback = jest.fn();

    const a = signal<number>();
    syncEffect(a, callback);

    a(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(1);

    callback.mockClear();
    destroySignal(a);
    a(2);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should not notify destroyed effects', () => {
    const callback = jest.fn();

    const a = signal<number>();
    const fx = syncEffect(a, callback);
    a(1);

    callback.mockClear();
    fx.destroy();
    a(2);
    expect(callback).toHaveBeenCalledTimes(0);
  });
});

describe('destroySignal()', () => {
  it('should destroy a signal', () => {
    const onDestroy = jest.fn();

    const a = signal({ onDestroy });
    destroySignal(a);

    expect(getSignalNode(a).isDestroyed).toBe(true);
    expect(onDestroy).toHaveBeenCalledTimes(1);

    onDestroy.mockClear();
    destroySignal(a);
    expect(onDestroy).toHaveBeenCalledTimes(0);
  });

  it('should not notify destroyed effects', () => {
    const callback = jest.fn();

    const a = signal<number>();
    const fx = syncEffect(a, callback);
    syncEffect(fx.onDestroy, callback);
    a(1);

    fx.destroy();
    callback.mockClear();
    destroySignal(a);
    expect(callback).toHaveBeenCalledTimes(0);
  });
});
