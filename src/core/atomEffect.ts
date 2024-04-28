import { Atom, AtomEffectNode, ComputedNode } from './common';
import { ENERGY_RUNTIME } from './runtime';
import { TaskScheduler } from './schedulers';
import { destroySignal, signal } from './signal';
import { createWeakRef } from './utils/createWeakRef';
import { nextSafeInteger } from './utils/nextSafeInteger';

/**
 * AtomEffect watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `AtomEffect` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `AtomEffect.run()`.
 */
export class AtomEffect<T, R> implements AtomEffectNode {
  readonly ref: WeakRef<AtomEffectNode> = createWeakRef(this);

  /** Monotonically increasing version of the effect */
  clock = 0;

  /** Whether the effect needs to be re-run */
  dirty = false;

  /** Whether the effect has been destroyed */
  isDestroyed = false;

  /**
   * Signals a result of the action function
   */
  readonly onResult = signal<R>();

  /**
   * Signals an error which occurred in the execution of the action function
   */
  readonly onError = signal<unknown>({ sync: true });

  /**
   * Signals that the effect has been destroyed
   */
  readonly onDestroy = signal<void>({ sync: true });

  private scheduler?: TaskScheduler;
  private source?: Atom<T>;
  private action: undefined | ((value: T) => R);

  private seenComputedNodes: undefined | ComputedNode<any>[];

  constructor(
    scheduler: TaskScheduler,
    source: Atom<T>,
    action: (value: T) => R,
  ) {
    this.scheduler = scheduler;
    this.action = action;
    this.source = source;
  }

  /**
   * Destroys the effect
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.scheduler = undefined;
    this.source = undefined;
    this.action = undefined;
    this.seenComputedNodes = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  /**
   * Schedule the effect to be re-run
   */
  notify(): void {
    if (this.isDestroyed) {
      return;
    }

    this.clock = nextSafeInteger(this.clock);
    const needsSchedule = !this.dirty;
    this.dirty = true;

    if (needsSchedule && this.scheduler) {
      this.scheduler.schedule(() => this.run());
    }
  }

  /**
   * Notify the effect that it must be destroyed
   */
  notifyDestroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.destroy();
  }

  /**
   * Execute the reactive expression in the context of this `AtomEffect`.
   *
   * Should be called by the user scheduling algorithm when the provided
   * `scheduler` TaskScheduler is called.
   */
  run(): void {
    if (!this.dirty) {
      return;
    }

    this.dirty = false;

    if (this.isDestroyed || !this.action || !this.source) {
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
    // Unfolding `tracked()` and `untracked()` for better performance
    const prevTracked = ENERGY_RUNTIME.tracked;
    try {
      ENERGY_RUNTIME.tracked = true;
      const value = this.source();
      ENERGY_RUNTIME.tracked = prevTracked;

      const result = this.action(value);

      this.onResult(result);
    } catch (error) {
      ENERGY_RUNTIME.tracked = prevTracked;
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

/**
 * Checks if the computed nodes have changed
 */
export function isComputedNodesChanged(nodes: ComputedNode<any>[]): boolean {
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
