import { nextSafeInteger } from '../utils/nextSafeInteger';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from '../utils/schedulers';

import { ComputedNode, SignalEffectNode } from './common';

export class SignalRuntime {
  private currentEffect: SignalEffectNode | undefined = undefined;
  private trackedEffects: SignalEffectNode[] = [];
  private visitedComputedNodes: ComputedNode<any>[] = [];

  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

  /** @readonly */
  clock = 0;

  updateSignalClock(): void {
    this.clock = nextSafeInteger(this.clock);
  }

  getCurrentEffect(): SignalEffectNode | undefined {
    return this.currentEffect;
  }

  getTrackedEffects(): SignalEffectNode[] {
    return this.trackedEffects;
  }

  setCurrentEffect(
    effect: SignalEffectNode | undefined,
  ): SignalEffectNode | undefined {
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

export const SIGNAL_RUNTIME = new SignalRuntime();

export function runEffects(): void {
  SIGNAL_RUNTIME.asyncScheduler.execute();
}
