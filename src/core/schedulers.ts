import { createQueue } from '../utils/queue';

export const queueTask = (callback: () => void) =>
  Promise.resolve().then(callback);

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

export function createAsyncTaskScheduler<T>(
  action: (entry: T) => void,
): TaskScheduler<T> {
  const queue = createQueue<T>();
  let isActive = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    try {
      let entry;
      while ((entry = queue.get())) {
        action(entry);
      }
    } finally {
      isActive = false;
    }
  };

  return {
    isEmpty: () => queue.isEmpty(),
    schedule: (entry: T) => {
      queue.add(entry);
      if (!isActive) queueTask(execute);
    },
    execute,
  };
}

export function createSyncTaskScheduler<T>(
  action: (entry: T) => void,
): TaskScheduler<T> {
  const queue = createQueue<T>();
  let isActive = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    try {
      let entry;
      while ((entry = queue.get())) {
        action(entry);
      }
    } finally {
      isActive = false;
    }
  };

  return {
    isEmpty: () => queue.isEmpty(),
    schedule: (entry: T) => {
      queue.add(entry);
      if (!isActive) execute();
    },
    execute,
  };
}
