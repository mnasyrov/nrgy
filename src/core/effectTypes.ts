import { Signal } from './common';

/**
 * A reactive effect, which can be manually destroyed.
 */
export type EffectSubscription<R> = Readonly<{
  /**
   * Signal that emits the result of the effect.
   */
  onResult: Signal<R>;

  /**
   * Signal that emits the error of the effect.
   */
  onError: Signal<unknown>;

  /**
   * Signal that emits when the effect is destroyed.
   */
  onDestroy: Signal<void>;

  /**
   * Shut down the effect, removing it from any upcoming scheduled executions.
   */
  destroy(): void;
}>;

export type EffectContext = {
  cleanup(callback: () => void): void;
};

export type EffectAction<T, R> = (value: T, context: EffectContext) => R;
