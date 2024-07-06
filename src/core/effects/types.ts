import { AtomList } from '../atoms/atomTypes';
import { Atom, Signal } from '../common/types';

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

export type EffectAction<T, R> = (
  value: T,
  context: EffectContext,
) => R | Promise<R>;

/**
 * Options for an effect
 */
export type EffectOptions = {
  sync?: boolean;
};

/**
 * An effect function
 */
export interface EffectFn {
  /**
   * Creates a new effect for a signal
   */ <T, R>(
    source: Signal<T>,
    action: EffectAction<T, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;

  /**
   * Creates a new effect for an atom
   */ <T, R>(
    source: Atom<T>,
    action: EffectAction<T, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;

  /**
   * Creates a new effect for a list of atoms
   */ <TValues extends unknown[], R>(
    sources: AtomList<TValues>,
    action: EffectAction<TValues, R>,
    options?: EffectOptions,
  ): EffectSubscription<R>;
}
