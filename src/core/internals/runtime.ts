import { WritableAtomNode } from '../common/reactiveNodes';

import { nextSafeInteger } from './nextSafeInteger';
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

  atomSources: WritableAtomNode<unknown>[] | undefined;

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
  runAsTracked<T>(fn: () => T): T {
    if (this.tracked) {
      throw new Error('Tracking context is already activated');
    }

    this.tracked = true;
    this.atomSources = [];

    try {
      return fn();
    } finally {
      this.tracked = false;
    }
  }

  /**
   * Run a function in an untracked context
   */
  runAsUntracked<T>(fn: () => T): T {
    const prevTracked = this.tracked;
    this.tracked = false;

    try {
      return fn();
    } finally {
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
