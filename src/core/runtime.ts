import { nextSafeInteger } from '../utils/nextSafeInteger';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from '../utils/schedulers';

import { AtomEffectNode, ComputedNode } from './common';

export class EnergyRuntime {
  private currentEffect: AtomEffectNode | undefined = undefined;
  private trackedEffects: AtomEffectNode[] = [];
  private visitedComputedNodes: ComputedNode<any>[] = [];

  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

  /** @readonly */
  clock = 0;

  updateAtomClock(): void {
    this.clock = nextSafeInteger(this.clock);
  }

  getCurrentEffect(): AtomEffectNode | undefined {
    return this.currentEffect;
  }

  getTrackedEffects(): AtomEffectNode[] {
    return this.trackedEffects;
  }

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

  getVisitedComputedNodes(): ComputedNode<any>[] {
    return this.visitedComputedNodes;
  }

  resetVisitedComputedNodes() {
    this.visitedComputedNodes = [];
  }

  visitComputedNode(node: ComputedNode<any>) {
    if (this.currentEffect) {
      this.visitedComputedNodes.push(node);
    }
  }
}

export const ENERGY_RUNTIME = new EnergyRuntime();

export function runEffects(): void {
  ENERGY_RUNTIME.asyncScheduler.execute();
}
