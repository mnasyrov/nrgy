import { createQueue } from './utils/queue';

const reportError =
  'reportError' in globalThis && typeof globalThis.reportError === 'function'
    ? globalThis.reportError
    : undefined;

/**
 * Task scheduler interface
 */
export type TaskScheduler = Readonly<{
  /** Check if the execution queue is empty */
  isEmpty(): boolean;

  /** Schedule a task */
  schedule(action: () => void): void;

  /** Execute the queue */
  execute(): void;
}>;

/**
 * Creates a microtask scheduler
 */
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

/**
 * Creates a synchronous task scheduler
 */
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
