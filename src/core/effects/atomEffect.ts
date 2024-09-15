import { getAtomNode } from '../atoms/atom';
import { AtomEffectNode } from '../common/reactiveNodes';
import { Atom } from '../common/types';
import { DataRef } from '../common/utilityTypes';
import { isPromise } from '../internals/isPromise';
import { RUNTIME } from '../internals/runtime';
import { TaskScheduler } from '../internals/schedulers';
import { BaseScope } from '../scope/baseScope';
import { destroySignal } from '../signals/common';
import { signal } from '../signals/signal';

import { generateEffectId } from './effectId';
import { EffectAction, EffectContext } from './types';

/**
 * AtomEffect watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `AtomEffect` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `AtomEffect.run()`.
 */
export class AtomEffect<T, R> implements AtomEffectNode {
  readonly id = generateEffectId();

  private _ref: DataRef<AtomEffectNode> | undefined;

  get ref(): DataRef<AtomEffectNode> {
    if (!this._ref) this._ref = { value: this };
    return this._ref;
  }

  private lastValueVersion: number | undefined;
  private notifiedAt: number | undefined;

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
    this.notifiedAt = undefined;

    if (this._ref) {
      this._ref.value = undefined;
      this._ref = undefined;
    }

    this.actionScope?.destroy();
    this.actionScope = undefined;
    this.actionContext = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  /**
   * Schedule the effect to be re-run
   */
  notify(): void {
    if (this.notifiedAt === RUNTIME.clock) {
      return;
    }
    this.notifiedAt = RUNTIME.clock;

    if (this.isDestroyed) {
      return;
    }

    const needsSchedule = !this.dirty;
    this.dirty = true;

    if (needsSchedule && this.scheduler) {
      this.scheduler.schedule(() => this.run());
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
    this.notifiedAt = undefined;

    if (this.isDestroyed || !this.action || !this.source) {
      return;
    }

    let sourceValue: any;
    let resultValue;
    let resultError;
    let isResultError;

    try {
      sourceValue = RUNTIME.runAsTracked(this, this.source);
    } catch (error) {
      isResultError = true;
      resultError = error;
    }

    try {
      if (this.isDestroyed) {
        return;
      }

      const node = getAtomNode(this.source);
      if (this.lastValueVersion === node.version) {
        // Value is not changed
        return;
      }
      this.lastValueVersion = node.version;

      this.actionScope?.destroy();

      if (!isResultError) {
        resultValue = this.action(sourceValue, this.getContext());
      }
    } catch (error) {
      isResultError = true;
      resultError = error;
    }

    if (isResultError) {
      this.onError(resultError);
      return;
    }

    if (isPromise(resultValue)) {
      resultValue
        .then((value) => this.onResult(value))
        .catch((error) => this.onError(error));
    } else {
      this.onResult(resultValue as any);
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
