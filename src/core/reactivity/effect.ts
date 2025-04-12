import { combineAtoms } from '../utils/combineAtoms';

import { EffectImpl } from './effectImpl';
import { RUNTIME } from './runtime';
import {
  Atom,
  AtomList,
  EffectCallback,
  EffectFn,
  EffectOptions,
} from './types';

/**
 * Creates a new synchronous effect
 */
export const syncEffect: EffectFn = function <T>(
  source: Atom<T> | AtomList<T[]>,
  callback: EffectCallback<T>,
  options?: EffectOptions,
) {
  return effect(source as any, callback, { sync: true, ...options });
};

/**
 * Creates a new effect
 */
export const effect: EffectFn = function <T>(
  source: Atom<T> | AtomList<T[]>,
  callback: EffectCallback<T>,
  options?: EffectOptions,
) {
  if (Array.isArray(source)) {
    const list = combineAtoms(source);
    return effect(list as any, callback as any, options);
  }

  const scheduler = options?.sync
    ? RUNTIME.syncScheduler
    : RUNTIME.asyncScheduler;

  let fxCallback: EffectCallback<T> = callback;

  if (options?.waitChanges) {
    let skipFirst = true;

    fxCallback = (value, context) => {
      if (skipFirst) {
        skipFirst = false;
      } else {
        callback(value, context);
      }
    };
  }

  const fx = new EffectImpl<T>(scheduler, source, fxCallback, options);

  // Effect starts dirty.
  fx.notify();

  return {
    destroy: () => fx.destroy(),
  };
};
