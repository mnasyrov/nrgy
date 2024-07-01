import { getAtomNode } from './atom';
import { Atom, AtomEffectNode, generateEffectId } from './common';
import { EffectAction, EffectContext } from './effectTypes';
import { RUNTIME } from './runtime';
import { TaskScheduler } from './schedulers';
import { BaseScope } from './scopeBase';
import { destroySignal, signal } from './signal';
import { createWeakRef } from './utils/createWeakRef';
import { isPromise } from './utils/isPromise';
import { ListItem, removeFromList } from './utils/list';
import { nextSafeInteger } from './utils/nextSafeInteger';

type AtomListItem = ListItem<{ atomId: number }>;

/**
 * AtomEffect watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `AtomEffect` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `AtomEffect.run()`.
 */
export class AtomEffect<T, R> implements AtomEffectNode {
  readonly id = generateEffectId();
  readonly ref: WeakRef<AtomEffectNode> = createWeakRef(this);

  /** Monotonically increasing version of the effect */
  clock = 0;

  private lastValueVersion: number | undefined;

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
    this.referredAtomIds = undefined;

    this.actionScope?.destroy();
    this.actionScope = undefined;
    this.actionContext = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  hasReferredAtom(atomId: number): boolean {
    for (let node = this.referredAtomIds; node; node = node.next) {
      if (node.atomId === atomId) {
        return true;
      }
    }
    return false;
  }

  addReferredAtom(atomId: number) {
    if (!this.hasReferredAtom(atomId)) {
      this.referredAtomIds = { atomId, next: this.referredAtomIds };
    }
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

    let result;

    try {
      const value = RUNTIME.runAsTracked(this, this.source);

      const node = getAtomNode(this.source);
      if (this.lastValueVersion === node.version) {
        // Value is not changed
        return;
      }
      this.lastValueVersion = node.version;

      this.actionScope?.destroy();

      result = this.action(value, this.getContext());
    } catch (error) {
      this.onError(error);
    }

    if (isPromise(result)) {
      result
        .then((value) => this.onResult(value))
        .catch((error) => this.onError(error));
    } else {
      this.onResult(result as any);
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
