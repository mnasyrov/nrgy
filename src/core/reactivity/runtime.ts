import { nextSafeInteger } from '../internals/nextSafeInteger';

import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';
import { ConsumerNode } from './types';

/**
 * @internal
 */
export class Runtime {
  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

  /**
   * Active effect in a tracking context
   */
  activeEffect: ConsumerNode | undefined;

  /** @readonly */
  batchLock: number = 0;

  /**
   * Marks the current computation context as tracked
   */
  isTracked(): boolean {
    return !!this.activeEffect;
  }

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
   * Run a function in a tracked context
   */
  runAsTracked<T>(effect: ConsumerNode, fn: () => T): T {
    const prevEffect = this.activeEffect;
    this.activeEffect = effect;

    try {
      return fn();
    } finally {
      this.activeEffect = prevEffect;
    }
  }

  /**
   * Run a function in an untracked context
   */
  runAsUntracked<T>(fn: () => T): T {
    const prevEffect = this.activeEffect;
    this.activeEffect = undefined;

    try {
      return fn();
    } finally {
      this.activeEffect = prevEffect;
    }
  }

  batch<T>(fn: () => T): T {
    try {
      this.batchLock++;

      if (this.batchLock === 1) {
        this.syncScheduler.pause();
        this.asyncScheduler.pause();
      }

      return fn();
    } finally {
      this.batchLock--;

      if (this.batchLock === 0) {
        this.syncScheduler.resume();
        this.asyncScheduler.resume();
      }
    }
  }

  runEffects() {
    this.syncScheduler.execute();
    this.asyncScheduler.execute();
  }
}

/**
 * @internal
 *
 * The energy runtime
 */
export const RUNTIME = new Runtime();
