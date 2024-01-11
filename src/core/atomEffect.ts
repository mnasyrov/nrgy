import { AtomEffectNode, ComputedNode } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { TaskScheduler } from './schedulers';
import { destroySignal, signal } from './signal';
import { createWeakRef } from './utils/createWeakRef';
import { nextSafeInteger } from './utils/nextSafeInteger';

/**
 * Watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `Watch` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `Watch.run()`.
 */
export class AtomEffect implements AtomEffectNode {
  readonly ref: WeakRef<AtomEffectNode> = createWeakRef(this);
  clock = 0;

  dirty = false;
  isDestroyed = false;

  readonly onResult = signal<any>();
  readonly onError = signal<unknown>({ sync: true });
  readonly onDestroy = signal<void>({ sync: true });

  private scheduler?: TaskScheduler;
  private action: undefined | (() => void);

  private seenComputedNodes: undefined | ComputedNode<any>[];

  constructor(scheduler: TaskScheduler, action: () => void) {
    this.scheduler = scheduler;
    this.action = action;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.scheduler = undefined;
    this.action = undefined;
    this.seenComputedNodes = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  notify(): void {
    if (this.isDestroyed) {
      return;
    }

    this.clock = nextSafeInteger(this.clock);
    const needsSchedule = !this.dirty;
    this.dirty = true;

    if (needsSchedule) {
      this.scheduler?.schedule(() => this.run());
    }
  }

  notifyDestroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.destroy();
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

    if (this.isDestroyed || !this.action) {
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
      const result = this.action();
      this.onResult(result);
    } catch (error) {
      errorRef = { error };
    } finally {
      ENERGY_RUNTIME.setCurrentEffect(prevEffect);

      this.seenComputedNodes = ENERGY_RUNTIME.getVisitedComputedNodes();

      if (!prevEffect) {
        ENERGY_RUNTIME.resetVisitedComputedNodes();
      }

      if (errorRef) {
        this.onError(errorRef.error);
      }
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
