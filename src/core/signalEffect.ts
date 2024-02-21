import { SignalEffectNode } from './common';
import { TaskScheduler } from './schedulers';
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
  private action?: (value: T) => unknown;

  constructor(scheduler: TaskScheduler, action: (value: T) => unknown) {
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

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  /**
   * Schedule the effect to be run
   */
  notify(value: T): void {
    if (this.isDestroyed) {
      return;
    }

    this.scheduler?.schedule(() => this.run(value));
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
      const result = this.action(value);
      this.onResult(result);
    } catch (error) {
      this.onError(error);
    }
  }
}
