import { Signal, SIGNAL_SYMBOL, SignalNode } from '../common';

/**
 * Checks if the given `value` is a reactive `Signal`.
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return typeof value === 'function' && SIGNAL_SYMBOL in value;
}

/**
 * @internal
 *
 * Returns `SignalNode` from the given Signal.
 */
export function getSignalNode<T>(value: Signal<T>): SignalNode<T> {
  return value[SIGNAL_SYMBOL] as SignalNode<T>;
}

/**
 * Returns a name of the given Signal
 */
export function getSignalName(value: Signal<any>): string | undefined {
  return getSignalNode(value).name;
}

/**
 * Destroys the signal
 */
export function destroySignal(value: Signal<any>): void {
  getSignalNode(value).destroy();
}

/**
 * Checks if the signal is destroyed
 */
export function isSignalDestroyed(value: Signal<any>): boolean {
  return getSignalNode(value).isDestroyed;
}

/**
 * Checks if the signal is subscribed
 */
export function isSignalSubscribed(value: Signal<any>): boolean {
  return getSignalNode(value).isSubscribed();
}
