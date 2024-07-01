import { Signal, SIGNAL_SYMBOL, SignalEffectNode, SignalNode } from './common';
import { SignalFn, SignalOptions } from './signalTypes';
import { createWeakRef } from './utils/createWeakRef';

/**
 * Checks if the given `value` is a reactive `Signal`.
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return typeof value === 'function' && SIGNAL_SYMBOL in value;
}

/**
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

class SignalImpl<T> implements SignalNode<T> {
  readonly ref: WeakRef<SignalNode<T>> = createWeakRef(this);

  readonly name?: string;

  private onEvent?: SignalOptions<T>['onEvent'];
  private onSubscribe?: SignalOptions<T>['onSubscribe'];
  private onUnsubscribe?: SignalOptions<T>['onUnsubscribe'];
  private onDestroy?: SignalOptions<T>['onDestroy'];
  private readonly consumerEffects = new Set<WeakRef<SignalEffectNode<T>>>();

  readonly sync?: boolean;
  isDestroyed = false;

  constructor(options?: SignalOptions<T>) {
    if (options) {
      this.name = options.name;
      this.sync = options.sync;
      this.onEvent = options.onEvent;
      this.onSubscribe = options.onSubscribe;
      this.onUnsubscribe = options.onUnsubscribe;
      this.onDestroy = options.onDestroy;
    }
  }

  /**
   * Emits a value
   */
  emit(value: T): void {
    if (this.isDestroyed) {
      return;
    }

    this.onEvent?.(value);

    this.producerChanged(value);
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    this.producerDestroyed();

    this.consumerEffects.clear();
    this.onUnsubscribe?.(true);
    this.onDestroy?.();

    this.onEvent = undefined;
    this.onSubscribe = undefined;
    this.onUnsubscribe = undefined;
    this.onDestroy = undefined;
  }

  isSubscribed(): boolean {
    return this.consumerEffects.size > 0;
  }

  subscribe(effectRef: WeakRef<SignalEffectNode<T>>): void {
    this.consumerEffects.add(effectRef);
    this.onSubscribe?.();
  }

  unsubscribe(effectRef: WeakRef<SignalEffectNode<T>>): void {
    if (this.consumerEffects.delete(effectRef)) {
      this.onUnsubscribe?.(this.consumerEffects.size === 0);
    }
  }

  /**
   * Notify all consumers of this producer that its value is changed.
   */
  protected producerChanged(value: T): void {
    if (this.consumerEffects.size === 0) {
      return;
    }

    let hasDeletion = false;

    for (const effectRef of this.consumerEffects) {
      const effect = effectRef.deref();

      if (!effect || effect.isDestroyed) {
        hasDeletion = true;
        this.consumerEffects.delete(effectRef);
        continue;
      }

      effect.notify(value);
    }

    if (hasDeletion) {
      this.onUnsubscribe?.(this.consumerEffects.size === 0);
    }
  }

  /**
   * Notify all consumers of this producer that it is destroyed
   */
  protected producerDestroyed(): void {
    for (const effectRef of this.consumerEffects) {
      const effect = effectRef.deref();

      if (effect && !effect.isDestroyed) {
        effect.notifyDestroy();
      }
    }
  }
}

/**
 * Factory to create `Signal`
 */
export const signal: SignalFn = <T = void>(
  options?: SignalOptions<T>,
): Signal<T> => {
  const node = new SignalImpl<T>(options);

  const result = (value: T) => node.emit(value);
  (result as any)[SIGNAL_SYMBOL] = node;

  return result as Signal<T>;
};
