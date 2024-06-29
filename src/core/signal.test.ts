import { expectEffectContext } from '../test/matchers';
import { flushMicrotasks } from '../test/testUtils';

import { effect, syncEffect } from './effect';
import { RUNTIME } from './runtime';
import {
  destroySignal,
  getSignalName,
  getSignalNode,
  isSignalDestroyed,
  signal,
} from './signal';
import { SignalEffect } from './signalEffect';

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
    expect(callback).toHaveBeenLastCalledWith(1, expectEffectContext());

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

  it('should not notify destroyed SignalEffect', () => {
    const callback = jest.fn();

    const a = signal<number>();
    const node = getSignalNode(a);

    const signalEffect = new SignalEffect(RUNTIME.syncScheduler, callback);
    node.subscribe(signalEffect.ref);

    node.emit(10);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(10, expectEffectContext());

    callback.mockClear();

    signalEffect.destroy();
    node.emit(20);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should should call onUnsubscribed() if a destroyed SignalEffect is found during notification', () => {
    const onUnsubscribe = jest.fn();

    const a = signal<number>({ onUnsubscribe });
    const node = getSignalNode(a);

    const signalEffect = new SignalEffect(RUNTIME.syncScheduler, () => {});
    node.subscribe(signalEffect.ref);

    node.emit(10);
    expect(onUnsubscribe).toHaveBeenCalledTimes(0);

    onUnsubscribe.mockClear();

    signalEffect.destroy();
    node.emit(20);
    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).toHaveBeenCalledWith(true);
  });

  it('should call the onEvent() callback when the emitter is called with a new value', () => {
    const onEvent = jest.fn();
    const source = signal<number>({ onEvent });

    source(10);
    expect(onEvent).toBeCalledTimes(1);
    expect(onEvent).toBeCalledWith(10);
  });

  it('should call the onSubscribe() callback when a new effect is subscribed', () => {
    const onSubscribe = jest.fn();

    const s = signal({ onSubscribe });

    effect(s, () => {});
    expect(onSubscribe).toBeCalledTimes(1);

    onSubscribe.mockClear();
    effect(s, () => {});
    expect(onSubscribe).toBeCalledTimes(1);
  });

  it('should call the onUnsubscribe() callback when the effect is unsubscribed', () => {
    const onUnsubscribe = jest.fn();

    const s = signal({ onUnsubscribe });

    const fx1 = effect(s, () => {});
    const fx2 = effect(s, () => {});

    fx2.destroy();
    expect(onUnsubscribe).toBeCalledTimes(1);
    expect(onUnsubscribe).toBeCalledWith(false);

    onUnsubscribe.mockClear();
    fx2.destroy();
    expect(onUnsubscribe).toBeCalledTimes(0);

    onUnsubscribe.mockClear();
    fx1.destroy();
    expect(onUnsubscribe).toBeCalledTimes(1);
    expect(onUnsubscribe).toBeCalledWith(true);
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

describe('isSignalDestroyed()', () => {
  it('should return true is the signal is destroyed', () => {
    const s = signal();
    expect(isSignalDestroyed(s)).toBe(false);

    destroySignal(s);
    expect(isSignalDestroyed(s)).toBe(true);
  });
});
