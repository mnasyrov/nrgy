import { createWeakRef } from '../utils/createWeakRef';
import { TaskScheduler } from '../utils/schedulers';

import { SignalEffectNode } from './common';
import { destroySignal, signal } from './signal';

export class SignalEffect<T> implements SignalEffectNode<any> {
  readonly ref: WeakRef<SignalEffectNode<T>> = createWeakRef(this);

  isDestroyed = false;
  next = signal<any>();

  private scheduler?: TaskScheduler;
  private callback?: (value: T) => unknown;
  private onError: undefined | ((error: unknown) => unknown);

  constructor(
    scheduler: TaskScheduler,
    callback: (value: T) => unknown,
    onError?: (error: unknown) => unknown,
  ) {
    this.scheduler = scheduler;
    this.callback = callback;
    this.onError = onError;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.scheduler = undefined;
    this.callback = undefined;
    this.onError = undefined;

    destroySignal(this.next);
  }

  notify(value: T): void {
    if (this.isDestroyed) {
      return;
    }

    this.scheduler?.schedule(() => this.run(value));
  }

  run(value: T): void {
    if (this.isDestroyed || !this.callback) {
      return;
    }

    try {
      const result = this.callback(value);
      this.next(result);
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
    }
  }
}
