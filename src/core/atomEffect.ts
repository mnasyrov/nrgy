import { Atom, AtomEffectNode, ComputedNode } from './common';
import { EffectAction, EffectContext } from './effectTypes';
import { ENERGY_RUNTIME } from './runtime';
import { TaskScheduler } from './schedulers';
import { BaseScope } from './scopeBase';
import { destroySignal, signal } from './signal';
import { createWeakRef } from './utils/createWeakRef';
import { isPromise } from './utils/isPromise';
import { ListItem, removeFromList } from './utils/list';
import { nextSafeInteger } from './utils/nextSafeInteger';

type AtomListItem = ListItem<{ atomId: number }>;
type ComputedNodeListItem = ListItem<{ node: ComputedNode<any> }>;

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
  private action?: EffectAction<T, R>;

  private actionScope?: BaseScope;
  private actionContext?: EffectContext;

  private seenComputedNodes: undefined | ComputedNodeListItem;
  referredAtomIds: undefined | AtomListItem;

  constructor(
    scheduler: TaskScheduler,
    source: Atom<T>,
    action: EffectAction<T, R>,
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
    this.referredAtomIds = undefined;

    this.actionScope?.destroy();
    this.actionScope = undefined;
    this.actionContext = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  addReferredAtom(atomId: number) {
    this.referredAtomIds = { atomId, next: this.referredAtomIds };
  }

  removeReferredAtom(atomId: number): void {
    if (!this.referredAtomIds) {
      return;
    }

    this.referredAtomIds = removeFromList(
      this.referredAtomIds,
      (node) => node.atomId === atomId,
    );
  }

  /**
   * Notify the effect that an atom has been accessed
   */
  notifyAccess(atomId: number): void {
    if (this.isDestroyed) {
      return;
    }

    this.addReferredAtom(atomId);
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
  notifyDestroy(atomId: number): void {
    if (this.isDestroyed) {
      return;
    }

    this.removeReferredAtom(atomId);

    if (!this.referredAtomIds) {
      this.destroy();
    }
  }

  addDependency(node: ComputedNode<any>): void {
    this.seenComputedNodes = { node, next: this.seenComputedNodes };
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

      return;
    }

    this.seenComputedNodes = undefined;

    let errorRef: undefined | { error: unknown };
    // Unfolding `tracked()` and `untracked()` for better performance
    const prevTracked = ENERGY_RUNTIME.tracked;
    let result;
    try {
      ENERGY_RUNTIME.tracked = true;
      const value = this.source();
      ENERGY_RUNTIME.tracked = prevTracked;

      this.actionScope?.destroy();
      result = this.action(value, this.getContext());

      if (!isPromise(result)) {
        this.onResult(result);
      }
    } catch (error) {
      this.seenComputedNodes = undefined;
      ENERGY_RUNTIME.tracked = prevTracked;
      errorRef = { error };
    } finally {
      ENERGY_RUNTIME.setCurrentEffect(prevEffect);

      if (errorRef) {
        this.onError(errorRef.error);
      }
    }

    if (isPromise(result)) {
      result
        .then((result) => {
          this.onResult(result);
        })
        .catch((error) => {
          this.onError(error);
        });
    }
  }

  private getContext(): EffectContext {
    if (!this.actionContext) {
      this.actionContext = {
        cleanup: (callback: () => void) => {
          if (!this.actionScope) {
            this.actionScope = new BaseScope();
          }
          this.actionScope.onDestroy(callback);
        },
      };
    }

    return this.actionContext;
  }
}

/**
 * Checks if the computed nodes have changed
 */
export function isComputedNodesChanged(
  list: undefined | ComputedNodeListItem,
): boolean {
  type List = typeof list;

  if (!list) {
    return true;
  }

  for (let item: List = list; item; item = item.next) {
    if (item.node.isChanged()) {
      return true;
    }
  }

  return false;
}
