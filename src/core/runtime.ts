import { AtomEffectNode, ComputedNode } from './common';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';
import { nextSafeInteger } from './utils/nextSafeInteger';

export class EnergyRuntime {
  private currentEffect: AtomEffectNode | undefined = undefined;
  private trackedEffects: AtomEffectNode[] = [];
  private visitedComputedNodes: ComputedNode<any>[] = [];

  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

  /**
   * @readonly
   * The current global clock of changed atoms.
   */
  clock = 0;

  /**
   * Updates the global clock of changed atoms
   */
  updateAtomClock(): void {
    this.clock = nextSafeInteger(this.clock);
  }

  /**
   * Returns the current effect node
   */
  getCurrentEffect(): AtomEffectNode | undefined {
    return this.currentEffect;
  }

  /**
   * Returns the list of tracked effects
   */
  getTrackedEffects(): AtomEffectNode[] {
    return this.trackedEffects;
  }

  /**
   * Sets the current effect node and tracks effects until the current effect frame is not empty
   */
  setCurrentEffect(
    effect: AtomEffectNode | undefined,
  ): AtomEffectNode | undefined {
    const prev = this.currentEffect;
    this.currentEffect = effect;

    if (effect) {
      this.trackedEffects.push(effect);
    } else {
      this.trackedEffects = [];
    }

    return prev;
  }

  /**
   * Returns the list of visited computed nodes
   */
  getVisitedComputedNodes(): ComputedNode<any>[] {
    return this.visitedComputedNodes;
  }

  /**
   * Resets the list of visited computed nodes
   */
  resetVisitedComputedNodes() {
    this.visitedComputedNodes = [];
  }

  /**
   * Visits a computed node if the current effect frame is not empty
   */
  visitComputedNode(node: ComputedNode<any>) {
    if (this.currentEffect) {
      this.visitedComputedNodes.push(node);
    }
  }
}

/**
 * The energy runtime
 */
export const ENERGY_RUNTIME = new EnergyRuntime();

/**
 * Runs all effects which are scheduled for the next microtask
 */
export function runEffects(): void {
  ENERGY_RUNTIME.asyncScheduler.execute();
}
