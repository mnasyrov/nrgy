import { nextSafeInteger } from '../utils/nextSafeInteger';

import { ComputedNode, EffectNode } from './common';
import {
  AsyncTaskScheduler,
  defaultRunnableAction,
  Runnable,
  SyncTaskScheduler,
} from './schedulers';

export class SignalRuntime {
  private currentEffect: EffectNode | undefined = undefined;
  private trackedEffects: EffectNode[] = [];
  private visitedComputedNodes: ComputedNode<any>[] = [];

  readonly asyncScheduler = new AsyncTaskScheduler<Runnable>(
    defaultRunnableAction,
  );

  readonly syncScheduler = new SyncTaskScheduler<Runnable>(
    defaultRunnableAction,
  );

  /** @readonly */
  clock = 0;

  /** @deprecated */
  reset(): void {
    this.currentEffect = undefined;
    this.trackedEffects = [];
    this.visitedComputedNodes = [];
    this.clock = 0;
  }

  updateSignalClock(): void {
    this.clock = nextSafeInteger(this.clock);
  }

  getCurrentEffect(): EffectNode | undefined {
    return this.currentEffect;
  }

  getTrackedEffects(): EffectNode[] {
    return this.trackedEffects;
  }

  setCurrentEffect(effect: EffectNode | undefined): EffectNode | undefined {
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
