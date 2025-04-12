import { DataRef } from '../common/utilityTypes';
import { TaskScheduler } from '../internals/schedulers';
import { BaseScope } from '../scope/baseScope';

import { getAtomNode } from './atomUtils';
import { RUNTIME } from './runtime';
import {
  Atom,
  ConsumerNode,
  EffectCallback,
  EffectContext,
  EffectOptions,
} from './types';

/**
 * @internal
 *
 * AtomEffect watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `AtomEffect` doesn't run reactive expressions itself, but relies on a consumer-provided
 * scheduling operation to coordinate calling `AtomEffect.run()`.
 */
export class EffectImpl<T> implements ConsumerNode {
  private _ref: DataRef<ConsumerNode> | undefined;

  getRef(): DataRef<ConsumerNode> {
    if (!this._ref) this._ref = { value: this };
    return this._ref;
  }

  private lastValueVersion: number | undefined;
  private notifiedAt: number | undefined;

  /** Whether the effect needs to be re-run */
  dirty = false;

  /** Whether the effect has been destroyed */
  isDestroyed = false;

  private scheduler?: TaskScheduler;
  private source?: Atom<T>;
  private action?: EffectCallback<T>;

  private actionScope?: BaseScope;
  private actionContext?: EffectContext;

  private onError?: (error: unknown) => void;
  private onDestroy?: () => void;

  constructor(
    scheduler: TaskScheduler,
    source: Atom<T>,
    action: EffectCallback<T>,
    options?: EffectOptions,
  ) {
    this.scheduler = scheduler;
    this.action = action;
    this.source = source;

    this.onError = options?.onError;
    this.onDestroy = options?.onDestroy;
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

    this.onDestroy?.();
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
      this.scheduler.schedule(this.run.bind(this));
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

      const sourceVersion = getAtomNode(this.source).version;
      if (this.lastValueVersion === sourceVersion) {
        // Value is not changed
        return;
      }
      this.lastValueVersion = sourceVersion;

      this.actionScope?.destroy();

      if (!isResultError) {
        this.action(sourceValue, this.getContext());
      }
    } catch (error) {
      isResultError = true;
      resultError = error;
    }

    if (isResultError) {
      this.onError?.(resultError);
      return;
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
