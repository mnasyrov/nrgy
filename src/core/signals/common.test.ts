import { syncEffect } from '../effects/effect';

import {
  destroySignal,
  getSignalName,
  getSignalNode,
  isSignalDestroyed,
} from './common';
import { signal } from './signal';

describe('getSignalName()', () => {
  it('should return a name of writable and read-only atoms', () => {
    const namelessSignal = signal();
    expect(getSignalName(namelessSignal)).toBe(undefined);

    const namedSignal = signal({ name: 'foo' });
    expect(getSignalName(namedSignal)).toBe('foo');
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
