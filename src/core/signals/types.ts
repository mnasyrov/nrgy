import { Signal } from '../common/types';

/**
 * Options passed to the `signal` creation function.
 */
export type SignalOptions<TEvent> = {
  /**
   * Signal's name
   */
  name?: string;

  /**
   * If true, the signal forces usage of "sync" scheduler.
   */
  sync?: boolean;

  /**
   * Callback is called at the same time when the signal is called
   */
  onEvent?: (event: TEvent) => void;

  /**
   * Callback is called when an effect is subscribed.
   */
  onSubscribe?: () => void;

  /**
   * Callback is called when an effect is unsubscribed.
   */
  onUnsubscribe?: (isEmpty: boolean) => void;

  /**
   * Callback is called when the signal is destroyed.
   */
  onDestroy?: () => void;
};

/**
 * Factory to create `Signal`
 */
export interface SignalFn {
  <T = void>(options?: SignalOptions<T>): Signal<T>;
}
