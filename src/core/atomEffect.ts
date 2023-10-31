import { nextSafeInteger } from '../utils/nextSafeInteger';
import { TaskScheduler } from '../utils/schedulers';

import { AtomEffectNode, ComputedNode } from './common';
import { ENERGY_RUNTIME } from './runtime';

/**
 * A cleanup function that can be optionally registered from the watch logic. If registered, the
 * cleanup logic runs before the next watch execution.
 */
export type AtomEffectCleanupFn = () => void;

/**
 * A callback passed to the watch function that makes it possible to register cleanup logic.
 */
export type AtomEffectCleanupRegisterFn = (
  cleanupFn: AtomEffectCleanupFn,
) => void;

const NOOP_CLEANUP_FN: AtomEffectCleanupFn = () => undefined;

export function createAtomEffect(
  scheduler: TaskScheduler,
  action: (onCleanup: AtomEffectCleanupRegisterFn) => void,
  onError?: (error: unknown) => unknown,
): AtomEffectNode {
  const node = new EffectNodeImpl(scheduler, action, onError);

  Object.assign<
    EffectNodeImpl,
    Pick<EffectNodeImpl, 'notify' | 'run' | 'destroy'>
  >(node, {
    notify: node.notify.bind(node),
    run: node.run.bind(node),
    destroy: node.destroy.bind(node),
  });

  return node;
}

/**
 * Watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `Watch` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `Watch.run()`.
 */
class EffectNodeImpl implements AtomEffectNode {
  readonly ref: WeakRef<AtomEffectNode> = new WeakRef(this);
  clock = 0;

  dirty = false;
  isDestroyed = false;

  private scheduler?: TaskScheduler;
  private action:
    | undefined
    | ((onCleanup: AtomEffectCleanupRegisterFn) => void);
  private onError: undefined | ((error: unknown) => unknown);
  private cleanupFn = NOOP_CLEANUP_FN;

  private seenComputedNodes: undefined | ComputedNode<any>[];

  private registerOnCleanup = (cleanupFn: AtomEffectCleanupFn) => {
    this.cleanupFn = cleanupFn;
  };

  constructor(
    scheduler: TaskScheduler,
    action: (onCleanup: AtomEffectCleanupRegisterFn) => void,
    onError?: (error: unknown) => unknown,
  ) {
    this.scheduler = scheduler;
    this.action = action;
    this.onError = onError;
  }

  notify(): void {
    if (this.isDestroyed) {
      return;
    }

    this.clock = nextSafeInteger(this.clock);
    const needsSchedule = !this.dirty;
    this.dirty = true;

    if (needsSchedule) {
      this.scheduler?.schedule(this.run);
    }
  }

  /**
   * Execute the reactive expression in the context of this `Watch` consumer.
   *
   * Should be called by the user scheduling algorithm when the provided
   * `schedule` hook is called by `Watch`.
   */
  run(): void {
    if (!this.dirty) {
      return;
    }

    this.dirty = false;

    if (this.isDestroyed) {
      return;
    }

    const prevEffect = ENERGY_RUNTIME.setCurrentEffect(this);

    const isChanged =
      !this.seenComputedNodes || isComputedNodesChanged(this.seenComputedNodes);

    if (!isChanged) {
      ENERGY_RUNTIME.setCurrentEffect(prevEffect);

      if (!prevEffect) {
        ENERGY_RUNTIME.resetVisitedComputedNodes();
      }

      return;
    }

    let errorRef: undefined | { error: unknown };

    try {
      this.cleanupFn();
      this.cleanupFn = NOOP_CLEANUP_FN;
      this.action?.(this.registerOnCleanup);
    } catch (error) {
      errorRef = { error };
    } finally {
      ENERGY_RUNTIME.setCurrentEffect(prevEffect);

      this.seenComputedNodes = ENERGY_RUNTIME.getVisitedComputedNodes();

      if (!prevEffect) {
        ENERGY_RUNTIME.resetVisitedComputedNodes();
      }

      if (errorRef && this.onError) {
        this.onError(errorRef.error);
      }
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.action = undefined;
    this.onError = undefined;
    this.scheduler = undefined;
    this.seenComputedNodes = undefined;

    try {
      this.cleanupFn();
    } finally {
      this.cleanupFn = NOOP_CLEANUP_FN;
    }
  }
}

function isComputedNodesChanged(nodes: ComputedNode<any>[]): boolean {
  if (nodes.length === 0) {
    return true;
  }

  for (const node of nodes) {
    if (node.isChanged()) {
      return true;
    }
  }

  return false;
}
