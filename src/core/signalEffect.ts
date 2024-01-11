import { SignalEffectNode } from './common';
import { destroySignal, signal } from './signal';
import { createWeakRef } from './utils/createWeakRef';
import { TaskScheduler } from './utils/schedulers';

export class SignalEffect<T> implements SignalEffectNode<any> {
  readonly ref: WeakRef<SignalEffectNode<T>> = createWeakRef(this);

  isDestroyed = false;

  readonly onResult = signal<any>();
  readonly onError = signal<unknown>({ sync: true });
  readonly onDestroy = signal<void>({ sync: true });

  private scheduler?: TaskScheduler;
  private callback?: (value: T) => unknown;

  constructor(scheduler: TaskScheduler, callback: (value: T) => unknown) {
    this.scheduler = scheduler;
    this.callback = callback;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.scheduler = undefined;
    this.callback = undefined;

    this.onDestroy();

    destroySignal(this.onResult);
    destroySignal(this.onError);
    destroySignal(this.onDestroy);
  }

  notify(value: T): void {
    if (this.isDestroyed) {
      return;
    }

    this.scheduler?.schedule(() => this.run(value));
  }

  notifyDestroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.destroy();
  }

  run(value: T): void {
    if (this.isDestroyed || !this.callback) {
      return;
    }

    try {
      const result = this.callback(value);
      this.onResult(result);
    } catch (error) {
      this.onError(error);
    }
  }
}
