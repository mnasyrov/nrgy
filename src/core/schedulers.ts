export type TaskScheduler<T> = Readonly<{
  isEmpty(): boolean;
  schedule(entry: T): void;
  execute(): void;
}>;
export type Runnable = Readonly<{ run: () => void }>;

export function defaultRunnableAction(task: Runnable): void {
  task.run();
}

export class MicrotaskScheduler<T> implements TaskScheduler<T> {
  private queue: T[] = [];
  private isActive = false;

  constructor(private readonly action: (entry: T) => void) {}

  isEmpty = (): boolean => this.queue.length === 0;

  schedule = (entry: T): void => {
    const prevSize = this.queue.length;
    this.queue.push(entry);

    if (prevSize === 0) {
      Promise.resolve().then(() => this.execute());
    }
  };

  execute = (): void => {
    if (this.isActive) {
      return;
    }

    this.isActive = true;

    try {
      while (this.queue.length > 0) {
        const list = this.queue;
        this.queue = [];

        for (const entry of list) {
          this.action(entry);
        }
      }
    } finally {
      this.isActive = false;
    }
  };
}

export class SyncTaskScheduler<T> implements TaskScheduler<T> {
  private queue: T[] = [];
  private isActive = false;

  constructor(private readonly action: (entry: T) => void) {}

  isEmpty = (): boolean => this.queue.length === 0;

  schedule = (entry: T): void => {
    this.queue.push(entry);
    this.execute();
  };

  execute = (): void => {
    if (this.isActive) {
      return;
    }

    this.isActive = true;

    try {
      while (this.queue.length > 0) {
        const list = this.queue;
        this.queue = [];

        for (const entry of list) {
          this.action(entry);
        }
      }
    } finally {
      this.isActive = false;
    }
  };
}
