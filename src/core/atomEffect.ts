import { createWeakRef } from '../utils/createWeakRef';
import { nextSafeInteger } from '../utils/nextSafeInteger';
import { TaskScheduler } from '../utils/schedulers';

import { AtomEffectNode, ComputedNode } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { destroySignal, signal } from './signal';

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
  next = signal<any>();

  private scheduler?: TaskScheduler;
  private action: undefined | (() => void);
  private onError: undefined | ((error: unknown) => unknown);

  private seenComputedNodes: undefined | ComputedNode<any>[];

  constructor(
    scheduler: TaskScheduler,
    action: () => void,
    onError?: (error: unknown) => unknown,
  ) {
    this.scheduler = scheduler;
    this.action = action;
    this.onError = onError;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.scheduler = undefined;
    this.action = undefined;
    this.onError = undefined;
    this.seenComputedNodes = undefined;

    destroySignal(this.next);
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
      this.next(result);
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
