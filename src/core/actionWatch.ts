import { ActionEffectNode } from './common';
import { Runnable, TaskScheduler } from './schedulers';

export class ActionWatch<T> implements ActionEffectNode<any> {
  readonly ref: WeakRef<ActionEffectNode<T>> = new WeakRef(this);

  isDestroyed = false;

  private scheduler?: TaskScheduler<Runnable>;
  private callback?: (value: T) => unknown;

  constructor(
    scheduler: TaskScheduler<Runnable>,
    callback: (value: T) => unknown,
  ) {
    this.scheduler = scheduler;
    this.callback = callback;
  }

  notify = (value: T): void => {
    if (this.isDestroyed) {
      return;
    }

    this.scheduler?.schedule({
      run: () => this.callback?.(value),
    });
  };

  destroy(): void {
    this.isDestroyed = true;
    this.callback = undefined;
    this.scheduler = undefined;
  }
}
