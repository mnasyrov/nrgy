import { Signal, SIGNAL_SYMBOL, SignalEffectNode, SignalNode } from './common';

/**
 * Options passed to the `signal` creation function.
 */
export type SignalOptions = {
  /**
   * Signal's name
   */
  name?: string;

  /**
   * If true, the signal forces usage of "sync" scheduler.
   */
  sync?: boolean;

  /**
   * Callback is called when the signal is destroyed.
   */
  onDestroy?: () => void;
};

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
export function destroySignal(emitter: Signal<any>): void {
  getSignalNode(emitter).destroy();
}

class SignalImpl<T> implements SignalNode<T> {
  readonly name?: string;

  private onDestroy?: () => void;
  private readonly consumerEffects = new Set<WeakRef<SignalEffectNode<T>>>();

  readonly sync?: boolean;
  isDestroyed = false;

  constructor(options?: SignalOptions) {
    if (options) {
      this.name = options.name;
      this.sync = options.sync;
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

    this.producerChanged(value);
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    this.producerDestroyed();

    this.consumerEffects.clear();
    this.onDestroy?.();
    this.onDestroy = undefined;
  }

  subscribe(effectRef: WeakRef<SignalEffectNode<T>>): void {
    this.consumerEffects.add(effectRef);
  }

  /**
   * Notify all consumers of this producer that its value is changed.
   */
  protected producerChanged(value: T): void {
    for (const effectRef of this.consumerEffects) {
      const effect = effectRef.deref();

      if (!effect || effect.isDestroyed) {
        this.consumerEffects.delete(effectRef);
        continue;
      }

      effect.notify(value);
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

export function signal<T = void>(options?: SignalOptions): Signal<T> {
  const node = new SignalImpl<T>(options);

  const result = (value: T) => node.emit(value);
  (result as any)[SIGNAL_SYMBOL] = node;

  return result as Signal<T>;
}
