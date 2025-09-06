import { DataRef } from '../common/utilityTypes';

import { getAtomNode } from './atomUtils';
import { RUNTIME } from './runtime';
import { TaskScheduler } from './schedulers';
import { Atom, EffectCallback, EffectOptions } from './types';
import { ConsumerNode, EffectNode } from './types.internal';

/**
 * @internal
 *
 * AtomEffect watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `AtomEffect` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `AtomEffect.run()`.
 */
export function createEffectNode<T>(
  scheduler: TaskScheduler,
  source: Atom<T>,
  action: EffectCallback<T>,
  options?: EffectOptions,
): EffectNode<T> {
  const node: EffectNode<T> = {
    dirty: false,
    isDestroyed: false,
    scheduler,
    action,
    source,
    onError: options?.onError,
    onDestroy: options?.onDestroy,

    getRef: () => getRef(node),
    destroy: () => destroy(node),
    notify: () => notify(node),
  };

  return node;
}

function getRef<T>(node: EffectNode<T>): DataRef<ConsumerNode> {
  if (!node.ref) {
    node.ref = { value: node };
  }
  return node.ref;
}

/**
 * Destroys the effect
 */
function destroy<T>(node: EffectNode<T>): void {
  if (node.isDestroyed) {
    return;
  }

  node.isDestroyed = true;
  node.scheduler = undefined;
  node.source = undefined;
  node.action = undefined;

  if (node.ref) {
    node.ref.value = undefined;
    node.ref = undefined;
  }

  node.onDestroy?.();
}

/**
 * Schedule the effect to be re-run
 */
function notify<T>(node: EffectNode<T>): void {
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

  if (node.isDestroyed || !node.action || !node.source) {
    return;
  }

  let sourceValue: any;
  let resultError;
  let isResultError;

  try {
    sourceValue = RUNTIME.runAsTracked(node, node.source);
  } catch (error) {
    isResultError = true;
    resultError = error;
  }

  try {
    if (node.isDestroyed) {
      return;
    }

    const sourceVersion = getAtomNode(node.source).version;
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
