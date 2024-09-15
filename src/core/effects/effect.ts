import { isAtom } from '../atoms/atom';
import { AtomList } from '../atoms/atomTypes';
import { Atom, Signal } from '../common/types';
import { RUNTIME } from '../internals/runtime';
import { getSignalNode, isSignal } from '../signals/common';
import { combineAtoms } from '../utils/combineAtoms';

import { AtomEffect } from './atomEffect';
import { SignalEffect } from './signalEffect';
import { EffectAction, EffectFn, EffectOptions } from './types';

/**
 * Creates a new effect
 */
export const effect: EffectFn = <T, R>(
  source: Signal<T> | Atom<T> | AtomList<T[]>,
  action: EffectAction<T, R>,
  options?: EffectOptions,
) => {
  let scheduler = options?.sync
    ? RUNTIME.syncScheduler
    : RUNTIME.asyncScheduler;

  if (isSignal<T>(source)) {
    const node = getSignalNode<T>(source);
    if (node.sync) {
      scheduler = RUNTIME.syncScheduler;
    }

    const signalEffect = new SignalEffect<T, R>(scheduler, action);

    const nodeRef = node.ref;
    node.subscribe(signalEffect);

    return {
      onResult: signalEffect.onResult,
      onError: signalEffect.onError,
      onDestroy: signalEffect.onDestroy,

      destroy: () => {
        nodeRef.deref()?.unsubscribe(signalEffect);
        signalEffect.destroy();
      },
    };
  }

  if (isAtom<T>(source)) {
    const atomEffect = new AtomEffect<T, R>(scheduler, source, action);

    // Effect starts dirty.
    atomEffect.notify();

    return {
      onResult: atomEffect.onResult,
      onError: atomEffect.onError,
      onDestroy: atomEffect.onDestroy,

      destroy: () => atomEffect.destroy(),
    };
  }

  if (Array.isArray(source)) {
    const list = combineAtoms(source);
    return effect(list as any, action as any, options);
  }

  throw new Error('Unexpected the first argument');
};

/**
 * Creates a new synchronous effect
 */
export const syncEffect: EffectFn = <T, R>(
  source: Signal<T> | Atom<T> | AtomList<T[]>,
  action: EffectAction<T, R>,
  options?: EffectOptions,
) => {
  return effect(source as any, action, { sync: true, ...options });
};
