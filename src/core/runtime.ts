import { AtomEffectNode } from './common';
import { nextSafeInteger } from './internals/nextSafeInteger';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';

/**
 * @internal
 */
export class Runtime {
  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

  currentEffect: AtomEffectNode | undefined = undefined;

  /** @readonly */
  batchLock: number = 0;

  /**
   * Marks the current computation context as tracked
   */
  tracked: boolean = false;

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
  runAsTracked<T>(effect: AtomEffectNode, fn: () => T): T {
    const prevEffect = this.currentEffect;
    this.currentEffect = effect;

    const prevTracked = this.tracked;
    this.tracked = true;

    try {
      return fn();
    } finally {
      this.currentEffect = prevEffect;
      this.tracked = prevTracked;
    }
  }

  /**
   * Run a function in an untracked context
   */
  runAsUntracked<T>(fn: () => T): T {
    const prevEffect = this.currentEffect;
    this.currentEffect = undefined;

    const prevTracked = this.tracked;
    this.tracked = false;

    try {
      return fn();
    } finally {
      this.currentEffect = prevEffect;
      this.tracked = prevTracked;
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
}

/**
 * @internal
 *
 * The energy runtime
 */
export const RUNTIME = new Runtime();

/**
 * Runs all effects which are scheduled for the next microtask
 */
export function runEffects(): void {
  RUNTIME.asyncScheduler.execute();
}
