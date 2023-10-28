import { TaskScheduler } from '../utils/schedulers';

import { ActionEffectNode } from './common';

export class ActionWatch<T> implements ActionEffectNode<any> {
  readonly ref: WeakRef<ActionEffectNode<T>> = new WeakRef(this);

  isDestroyed = false;

  private scheduler?: TaskScheduler;
  private callback?: (value: T) => unknown;

  constructor(scheduler: TaskScheduler, callback: (value: T) => unknown) {
    this.scheduler = scheduler;
    this.callback = callback;
  }

  notify = (value: T): void => {
    if (this.isDestroyed) {
      return;
    }

    this.scheduler?.schedule(() => this.callback?.(value));
  };

  destroy(): void {
    this.isDestroyed = true;
    this.callback = undefined;
    this.scheduler = undefined;
  }
}
