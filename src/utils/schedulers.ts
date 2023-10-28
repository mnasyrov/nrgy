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

export type TaskScheduler = Readonly<{
  isEmpty(): boolean;
  schedule(action: () => void): void;
  execute(): void;
}>;

export function createMicrotaskScheduler(
  onError?: (error: unknown) => void,
): TaskScheduler {
  const queue = createQueue<() => void>();
  let isActive = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let action;
    while ((action = queue.get())) {
      try {
        action();
      } catch (error) {
        (onError ?? reportError)?.(error);
      }
    }

    isActive = false;
  };

  return {
    isEmpty: () => queue.isEmpty(),
    schedule: (entry) => {
      const prevEmpty = queue.isEmpty();
      queue.add(entry);

      if (prevEmpty && !isActive) {
        queueMicrotask(execute);
      }
    },
    execute,
  };
}

export function createSyncTaskScheduler(
  onError?: (error: unknown) => void,
): TaskScheduler {
  const queue = createQueue<() => void>();
  let isActive = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let action;
    while ((action = queue.get())) {
      try {
        action();
      } catch (error) {
        (onError ?? reportError)?.(error);
      }
    }
    isActive = false;
  };

  return {
    isEmpty: () => queue.isEmpty(),
    schedule: (entry) => {
      queue.add(entry);
      if (!isActive) execute();
    },
    execute,
  };
}