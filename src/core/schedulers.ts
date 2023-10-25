import { createQueue } from '../utils/queue';

export const queueTask = (task: () => void): unknown =>
  Promise.resolve().then(task);

export const queueMicrotask =
  'queueMicrotask' in global ? global.queueMicrotask : queueTask;

export type TaskScheduler<T> = Readonly<{
  isEmpty(): boolean;
  schedule(entry: T): void;
  execute(): void;
}>;
export type Runnable = Readonly<{ run: () => void }>;

export function defaultRunnableAction(task: Runnable): void {
  task.run();
}

export class AsyncTaskScheduler<T> implements TaskScheduler<T> {
  private queue = createQueue<T>();
  private isActive = false;
  private readonly task: () => void;

  constructor(private readonly action: (entry: T) => void) {
    this.task = this.execute.bind(this);
  }

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  schedule(entry: T): void {
    this.queue.add(entry);
    if (!this.isActive) queueTask(this.task);
  }

  execute(): void {
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
  }
}

export class SyncTaskScheduler<T> implements TaskScheduler<T> {
  private queue = createQueue<T>();
  private isActive = false;

  constructor(private readonly action: (entry: T) => void) {}

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  schedule(entry: T): void {
    this.queue.add(entry);
    if (!this.isActive) this.execute();
  }

  execute(): void {
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
  }
}
