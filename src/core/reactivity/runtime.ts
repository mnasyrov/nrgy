import { nextSafeInteger } from '../internals/nextSafeInteger';

import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';
import { ObserverNode, ObserverRef } from './types.internal';

/**
 * @internal
 */
export class Runtime {
  readonly asyncScheduler = createMicrotaskScheduler();
  readonly syncScheduler = createSyncTaskScheduler();

  nextId = 1;

  /** @readonly */
  activeObserver: ObserverNode | undefined;

  /** @readonly */
  batchLock: number = 0;

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
  runAsTracked<T>(node: ObserverNode, fn: () => T): T {
    const prev = this.activeObserver;
    this.activeObserver = node;

    try {
      return fn();
    } finally {
      this.activeObserver = prev;
    }
  }

  /**
   * Run a function in an untracked context
   */
  runAsUntracked<T>(fn: () => T): T {
    const prev = this.activeObserver;
    this.activeObserver = undefined;

    try {
      return fn();
    } finally {
      this.activeObserver = prev;
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

/** @internal */
export function getObserverRef(node: ObserverNode): ObserverRef {
  if (!node.ref) {
    node.ref = { node };
  }
  return node.ref;
}
