import { createAction } from 'rx-effects';
import { Subject } from 'rxjs';

import { destroySignal, isSignal, signal, syncEffect } from '../core';
import { getSignalNode, isSignalSubscribed } from '../core/signals/signal';
import { expectEffectContext } from '../test/matchers';

import { fromAction, toAction } from './action';

describe('toAction()', () => {
  it('should adapt a Signal to an Action', () => {
    const source = signal<number>();
    const signalCallback = jest.fn();
    syncEffect(source, signalCallback);

    const action = toAction(source, { sync: true });
    const actionCallback = jest.fn();
    action.event$.subscribe(actionCallback);

    expect(action).toBeInstanceOf(Function);
    expect(action.event$).toBeDefined();
    expect(action.event$.subscribe).toBeDefined();

    source(10);
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(10, expectEffectContext());
    expect(actionCallback).toHaveBeenCalledTimes(1);
    expect(actionCallback).toHaveBeenCalledWith(10);

    signalCallback.mockClear();
    actionCallback.mockClear();

    action(20);
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(20, expectEffectContext());
    expect(actionCallback).toHaveBeenCalledTimes(1);
    expect(actionCallback).toHaveBeenCalledWith(20);
  });

  it('should unsubscribe the Signal when the Action is unsubscribed', () => {
    const source = signal<number>();
    const action = toAction(source);

    expect(isSignalSubscribed(source)).toBe(false);

    const subscription = action.event$.subscribe();
    expect(isSignalSubscribed(source)).toBe(true);

    subscription.unsubscribe();
    expect(isSignalSubscribed(source)).toBe(false);
  });
});

describe('fromAction()', () => {
  it('should create a Signal which sink events from the Action', () => {
    const a = createAction<number>();
    const actionCallback = jest.fn();
    a.event$.subscribe(actionCallback);

    const s = fromAction(a);
    const signalCallback = jest.fn();
    syncEffect(s, signalCallback);

    expect(isSignal(s)).toBe(true);

    a(10);
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(10, expectEffectContext());
    expect(actionCallback).toHaveBeenCalledTimes(1);
    expect(actionCallback).toHaveBeenCalledWith(10);

    signalCallback.mockClear();
    actionCallback.mockClear();

    s(20);
    expect(signalCallback).toHaveBeenCalledTimes(1);
    expect(signalCallback).toHaveBeenCalledWith(20, expectEffectContext());
    expect(actionCallback).toHaveBeenCalledTimes(0);
  });

  it('should unsubscribe the Action when the Signal is unsubscribed', () => {
    const event$ = new Subject<number>();
    const a = (v: number) => event$.next(v);
    a.event$ = event$;

    const s = fromAction(a);

    expect(event$.observed).toBe(false);

    const subscription = syncEffect(s, () => {});
    expect(event$.observed).toBe(true);

    subscription.destroy();
    expect(event$.observed).toBe(false);

    const node = getSignalNode(s);
    expect(() => (node as any).onUnsubscribe(true)).not.toThrow();
  });

  it('should unsubscribe the Action when the Signal is destroyed', () => {
    const event$ = new Subject<number>();
    const a = (v: number) => event$.next(v);
    a.event$ = event$;

    const s = fromAction(a);

    expect(event$.observed).toBe(false);

    syncEffect(s, () => {});
    expect(event$.observed).toBe(true);

    destroySignal(s);
    expect(event$.observed).toBe(false);
  });
});
