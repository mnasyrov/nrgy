import { AtomOptions } from './atom';
import { SignalEffectNode, SignalNode } from './common';

const SIGNAL_SYMBOL = Symbol.for('ngry.signal');

/**
 * Signal is an event emitter
 *
 * @param operator Optional transformation or handler for an event
 *
 * @field event$ - Observable for emitted events.
 *
 * @example
 * ```ts
 * // Create the signal
 * const submitForm = signal<{login: string, password: string}>();
 *
 * // Call the signal
 * submitForm({login: 'foo', password: 'bar'});
 *
 * // Handle signal's events
 * effect(submitForm, (formData) => {
 *   // Process the formData
 * });
 * ```
 */
export type Signal<Event> = {
  (event: Event): void;
  readonly [SIGNAL_SYMBOL]: unknown;
} & ([Event] extends [undefined | void]
  ? { (event?: Event): void }
  : { (event: Event): void });

/**
 * Options passed to the `signal` creation function.
 */
export type SignalOptions = {
  /**
   * Signal's name
   */
  name?: string;

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

export function getSignalNode<T>(value: Signal<T>): SignalNode<T> {
  return value[SIGNAL_SYMBOL] as SignalNode<T>;
}

export function destroySignal(emitter: Signal<any>): void {
  getSignalNode(emitter).destroy();
}

export function isSignalObserved(emitter: Signal<any>): boolean {
  return getSignalNode(emitter).isObserved();
}

class SignalImpl<T> implements SignalNode<T> {
  private readonly name?: string;
  private onDestroy?: () => void;
  private readonly consumerEffects = new Set<WeakRef<SignalEffectNode<T>>>();

  isDestroyed = false;

  constructor(options?: AtomOptions<T>) {
    this.name = options?.name;
    this.onDestroy = options?.onDestroy;
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

    this.consumerEffects.clear();
    this.isDestroyed = true;
    this.onDestroy?.();
    this.onDestroy = undefined;
  }

  subscribe(effectRef: WeakRef<SignalEffectNode<T>>): void {
    this.consumerEffects.add(effectRef);
  }

  isObserved(): boolean {
    return this.consumerEffects.size > 0;
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
}

export function signal<T = void>(options?: SignalOptions): Signal<T> {
  const node = new SignalImpl<T>(options);

  const result = (value: T) => node.emit(value);
  (result as any)[SIGNAL_SYMBOL] = node;

  return result as Signal<T>;
}
