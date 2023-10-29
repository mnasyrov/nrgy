import { nextSafeInteger } from '../utils/nextSafeInteger';
import { TaskScheduler } from '../utils/schedulers';

import { ComputedNode, SignalEffectNode } from './common';
import { SIGNAL_RUNTIME } from './runtime';

/**
 * A cleanup function that can be optionally registered from the watch logic. If registered, the
 * cleanup logic runs before the next watch execution.
 */
export type SignalEffectCleanupFn = () => void;

/**
 * A callback passed to the watch function that makes it possible to register cleanup logic.
 */
export type SignalEffectCleanupRegisterFn = (
  cleanupFn: SignalEffectCleanupFn,
) => void;

const NOOP_CLEANUP_FN: SignalEffectCleanupFn = () => undefined;

export function createSignalEffect(
  scheduler: TaskScheduler,
  action: (onCleanup: SignalEffectCleanupRegisterFn) => void,
  onError?: (error: unknown) => unknown,
): SignalEffectNode {
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
class EffectNodeImpl implements SignalEffectNode {
  readonly ref: WeakRef<SignalEffectNode> = new WeakRef(this);
  clock = 0;

  dirty = false;
  isDestroyed = false;

  private scheduler?: TaskScheduler;
  private action:
    | undefined
    | ((onCleanup: SignalEffectCleanupRegisterFn) => void);
  private onError: undefined | ((error: unknown) => unknown);
  private cleanupFn = NOOP_CLEANUP_FN;

  private seenComputedNodes: undefined | ComputedNode<any>[];

  private registerOnCleanup = (cleanupFn: SignalEffectCleanupFn) => {
    this.cleanupFn = cleanupFn;
  };

  constructor(
    scheduler: TaskScheduler,
    action: (onCleanup: SignalEffectCleanupRegisterFn) => void,
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

    const prevEffect = SIGNAL_RUNTIME.setCurrentEffect(this);

    const isChanged =
      !this.seenComputedNodes || isComputedNodesChanged(this.seenComputedNodes);

    if (!isChanged) {
      SIGNAL_RUNTIME.setCurrentEffect(prevEffect);

      if (!prevEffect) {
        SIGNAL_RUNTIME.resetVisitedComputedNodes();
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
      SIGNAL_RUNTIME.setCurrentEffect(prevEffect);

      this.seenComputedNodes = SIGNAL_RUNTIME.getVisitedComputedNodes();

      if (!prevEffect) {
        SIGNAL_RUNTIME.resetVisitedComputedNodes();
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