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

const queueTask = (task: () => void): unknown => Promise.resolve().then(task);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queueMicrotask =
  'queueMicrotask' in global ? global.queueMicrotask : queueTask;

export class AsyncTaskScheduler<T> implements TaskScheduler<T> {
  private queue = new Queue<T>();
  private isActive = false;

  constructor(private readonly action: (entry: T) => void) {}

  isEmpty = (): boolean => !this.queue.head;

  schedule = (entry: T): void => {
    this.queue.push(entry);
    if (!this.isActive) queueTask(this.execute);
  };

  execute = (): void => {
    dump('begin execute', { isActive: this.isActive, queue: this.queue });

    if (this.isActive) return;

    this.isActive = true;

    try {
      let entry;
      while ((entry = this.queue.get())) {
        dump('execute', entry);
        this.action(entry);
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
