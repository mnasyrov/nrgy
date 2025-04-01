import { AtomList } from '../atoms/atomTypes';
import { Atom } from '../common/types';
import { RUNTIME } from '../internals/runtime';
import { combineAtoms } from '../utils/combineAtoms';

import { AtomEffect } from './atomEffect';
import { EffectAction, EffectFn, EffectOptions } from './types';

/**
 * Creates a new effect
 */
export const effect: EffectFn = <T>(
  source: Atom<T> | AtomList<T[]>,
  action: EffectAction<T>,
  options?: EffectOptions,
) => {
  if (Array.isArray(source)) {
    const list = combineAtoms(source);
    return effect(list as any, action as any, options);
  }

  const scheduler = options?.sync
    ? RUNTIME.syncScheduler
    : RUNTIME.asyncScheduler;

  let fxAction: EffectAction<T> = action;

  if (options?.waitChanges) {
    let skipFirst = true;

    fxAction = (value, context) => {
      if (skipFirst) {
        skipFirst = false;
      } else {
        action(value, context);
      }
    };
  }

  const atomEffect = new AtomEffect<T>(scheduler, source, fxAction, options);

  // Effect starts dirty.
  atomEffect.notify();

  return {
    destroy: () => atomEffect.destroy(),
  };
};

/**
 * Creates a new synchronous effect
 */
export const syncEffect: EffectFn = <T>(
  source: Atom<T> | AtomList<T[]>,
  action: EffectAction<T>,
  options?: EffectOptions,
) => {
  return effect(source as any, action, { sync: true, ...options });
};
