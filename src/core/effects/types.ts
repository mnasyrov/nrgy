import { AtomList } from '../atoms/atomTypes';
import { Atom } from '../common/types';

/**
 * A reactive effect, which can be manually destroyed.
 */
export type EffectSubscription = Readonly<{
  /**
   * Unsubscribes and destroys the effect
   */
  destroy(): void;
}>;

export type EffectContext = {
  cleanup(callback: () => void): void;
};

export type EffectAction<T> = (value: T, context: EffectContext) => unknown;

/**
 * Options for an effect
 */
export type EffectOptions = {
  sync?: boolean;

  /**
   * Callback is called when the action trows an error
   */
  onError?: (error: unknown) => void;

  /**
   * Callback is called when the effect has been destroyed
   */
  onDestroy?: () => void;

  waitChanges?: boolean;
};

/**
 * An effect function
 */
export interface EffectFn {
  /**
   * Creates a new effect for an atom
   */ <T>(
    source: Atom<T>,
    action: EffectAction<T>,
    options?: EffectOptions,
  ): EffectSubscription;

  /**
   * Creates a new effect for a list of atoms
   */ <TValues extends unknown[]>(
    sources: AtomList<TValues>,
    action: EffectAction<TValues>,
    options?: EffectOptions,
  ): EffectSubscription;
}
