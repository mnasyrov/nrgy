import { SignalEffectNode } from './common';
import { EffectAction, EffectContext } from './effectTypes';
import { TaskScheduler } from './schedulers';
import { BaseScope } from './scopeBase';
import { destroySignal, signal } from './signal';
import { createWeakRef } from './utils/createWeakRef';

/**
 * SignalEffect represents a subscription to a signal
 */
export class SignalEffect<T> implements SignalEffectNode<any> {
  readonly ref: WeakRef<SignalEffectNode<T>> = createWeakRef(this);

  isDestroyed = false;

  /**
   * Signals a result of the action function
   */
  readonly onResult = signal<any>();

  /**
   * Signals an error which occurred in the execution of the action function
   */
  readonly onError = signal<unknown>({ sync: true });

  /**
   * Signals that the effect has been destroyed
   */
  readonly onDestroy = signal<void>({ sync: true });

  private scheduler?: TaskScheduler;
  private action?: EffectAction<T, unknown>;

  private actionScope?: BaseScope;
  private actionContext?: EffectContext;

  constructor(scheduler: TaskScheduler, action: EffectAction<T, unknown>) {
    this.scheduler = scheduler;
    this.action = action;
  }

  /**
   * Destroys the effect
   */
  destroy(): void {
    this.isDestroyed = true;
    this.scheduler = undefined;
    this.action = undefined;

    this.actionScope?.destroy();
    this.actionScope = undefined;
    this.actionContext = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  /**
   * Schedule the effect to be run
   */
  notify(value: T): void {
    if (!this.isDestroyed && this.scheduler) {
      this.scheduler.schedule(() => this.run(value));
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
   * Execute the subscriber's action in the context of this effect.
   *
   * Should be called by the user scheduling algorithm when the provided
   * `scheduler` TaskScheduler is called.
   */
  run(value: T): void {
    if (this.isDestroyed || !this.action) {
      return;
    }

    try {
      this.actionScope?.destroy();
      const result = this.action(value, this.getContext());
      this.onResult(result);
    } catch (error) {
      this.onError(error);
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
