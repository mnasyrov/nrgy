import { dump } from '../test/dump';

import { Queue } from './utils';

export type TaskScheduler<T> = Readonly<{
  isEmpty(): boolean;
  schedule(entry: T): void;
  execute(): void;
}>;
export type Runnable = Readonly<{ run: () => void }>;

export function defaultRunnableAction(task: Runnable): void {
  task.run();
}

const queueMicrotaskPolyfill = (task: () => void): unknown =>
  Promise.resolve().then(task);

// Polyfill is faster, the benchmark needs to be reviewed.
// const queueMicrotask =
//   'queueMicrotask' in global ? global.queueMicrotask : queueMicrotaskPolyfill;

const queueMicrotask = queueMicrotaskPolyfill;

export class MicrotaskScheduler<T> implements TaskScheduler<T> {
  private queue: T[] = [];
  private isActive = false;

  constructor(private readonly action: (entry: T) => void) {}

  isEmpty = (): boolean => this.queue.length === 0;

  schedule = (entry: T): void => {
    const prevSize = this.queue.length;
    this.queue.push(entry);

    dump('scheduled', { entry, queue: this.queue });

    // if (prevSize === 0 && !this.isActive) {
    if (prevSize === 0) {
      queueMicrotask(this.execute);
    }
  };

  execute = (): void => {
    dump('begin execute', { isActive: this.isActive, queue: this.queue });

    if (this.isActive) {
      return;
    }

    this.isActive = true;

    try {
      // while (this.queue.length > 0) {
      if (this.queue.length > 0) {
        const list = this.queue;
        this.queue = [];

        for (const entry of list) {
          dump('execute', entry);
          this.action(entry);
        }
      }
    } finally {
      this.isActive = false;
      dump('finish execute', { isActive: this.isActive, queue: this.queue });
    }
  };
}

export class SyncTaskScheduler<T> implements TaskScheduler<T> {
  private queue = new Queue<T>();
  private isActive = false;

  constructor(private readonly action: (entry: T) => void) {}

  isEmpty = (): boolean => !this.queue.head;

  schedule = (entry: T): void => {
    this.queue.push(entry);
    if (!this.isActive) this.execute();
  };

  execute = (): void => {
    if (this.isActive) return;

    this.isActive = true;

    try {
      let entry;
      while ((entry = this.queue.get())) {
        this.action(entry);
      }
    } finally {
      this.isActive = false;
    }
  };
}
