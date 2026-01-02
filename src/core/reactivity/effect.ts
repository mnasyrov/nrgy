import { combineAtoms } from '../utils/combineAtoms';

import { getAtomNode } from './atomUtils';
import { RUNTIME } from './runtime';
import {
  Atom,
  AtomList,
  EffectCallback,
  EffectFn,
  EffectOptions,
} from './types';
import { destroyEffect, EffectNode } from './types.internal';

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
  sourceArg: Atom<T> | AtomList<T[]>,
  callback: EffectCallback<T>,
  options?: EffectOptions,
) {
  const sourceAtom: Atom<any> = Array.isArray(sourceArg)
    ? combineAtoms(sourceArg)
    : sourceArg;

  const scheduler = options?.sync
    ? RUNTIME.syncScheduler
    : RUNTIME.asyncScheduler;

  let fxCallback: EffectCallback<T> = callback;

  if (options?.waitChanges) {
    let skipFirst = true;

    fxCallback = (value) => {
      if (skipFirst) {
        skipFirst = false;
      } else {
        callback(value);
      }
    };
  }

  const node: EffectNode<T> = {
    id: RUNTIME.nextId++,
    label: options?.label,
    isDestroyed: false,

    // Effect starts dirty.
    dirty: true,

    scheduler,
    action: fxCallback,
    sourceAtom,
    onError: options?.onError,
    onDestroy: options?.onDestroy,
  };

  scheduler.schedule(() => runEffect(node));

  return {
    destroy: () => destroyEffect(node),
  };
};

/**
 * @internal
 *
 * Schedule the effect to be re-run
 */
export function notifyEffect<T>(node: EffectNode<T>): void {
  if (node.isDestroyed) {
    return;
  }

  const needsSchedule = !node.dirty;
  node.dirty = true;

  if (needsSchedule && node.scheduler) {
    node.scheduler.schedule(() => runEffect(node));
  }
}

/**
 * @internal
 *
 * Execute the reactive expression in the context of this `AtomEffect`.
 *
 * Should be called by the user scheduling algorithm when the provided
 * `scheduler` TaskScheduler is called.
 */
export function runEffect<T>(node: EffectNode<T>): void {
  if (!node.dirty) {
    return;
  }

  node.dirty = false;

  if (node.isDestroyed || !node.action || !node.sourceAtom) {
    return;
  }

  let sourceValue: any;
  let resultError;
  let isResultError;

  try {
    sourceValue = RUNTIME.runAsTracked(node, node.sourceAtom);
  } catch (error) {
    isResultError = true;
    resultError = error;
  }

  try {
    if (node.isDestroyed) {
      return;
    }

    const sourceVersion = getAtomNode(node.sourceAtom).version;
    if (node.lastValueVersion === sourceVersion) {
      // Value is not changed
      return;
    }
    node.lastValueVersion = sourceVersion;

    if (!isResultError) {
      node.action(sourceValue);
    }
  } catch (error) {
    isResultError = true;
    resultError = error;
  }

  if (isResultError) {
    node.onError?.(resultError);
    return;
  }
}
