import { createQueue } from './queue';

const reportError =
  typeof self !== 'undefined' && typeof self.reportError === 'function'
    ? self.reportError
    : undefined;

export type QueueMicrotaskFn = (callback: () => void) => void;

export const queueMicrotaskPolyfill: QueueMicrotaskFn = (
  callback: () => void,
) => {
  Promise.resolve().then(callback);
};

export const queueMicrotask: QueueMicrotaskFn =
  'queueMicrotask' in global ? global.queueMicrotask : queueMicrotaskPolyfill;

export type TaskScheduler<T> = Readonly<{
  isEmpty(): boolean;
  schedule(entry: T): void;
  execute(): void;
}>;

export type Runnable = Readonly<{ run: () => void }>;

export function createMicrotaskScheduler<T extends Runnable = Runnable>(
  onError?: (error: unknown) => void,
): TaskScheduler<T> {
  const queue = createQueue<T>();
  let isActive = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let entry;
    while ((entry = queue.get())) {
      try {
        entry.run();
      } catch (error) {
        (onError ?? reportError)?.(error);
      }
    }

    isActive = false;
  };

  return {
    isEmpty: () => queue.isEmpty(),
    schedule: (entry: T) => {
      const prevEmpty = queue.isEmpty();
      queue.add(entry);

      if (prevEmpty && !isActive) {
        queueMicrotask(execute);
      }
    },
    execute,
  };
}

export function createSyncTaskScheduler<T extends Runnable = Runnable>(
  onError?: (error: unknown) => void,
): TaskScheduler<T> {
  const queue = createQueue<T>();
  let isActive = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let entry;
    while ((entry = queue.get())) {
      try {
        entry.run();
      } catch (error) {
        (onError ?? reportError)?.(error);
      }
    }
    isActive = false;
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
