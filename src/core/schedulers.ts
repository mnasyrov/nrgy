import { createQueue } from './utils/queue';
import { nrgyReportError } from './utils/reportError';

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
 * Task scheduler options
 */
export type TaskSchedulerOptions = {
  /** An error handler */
  onError?: (error: unknown) => void;
};

/**
 * Creates a microtask scheduler
 */
export function createMicrotaskScheduler(
  options?: TaskSchedulerOptions,
): TaskScheduler {
  const onError = options?.onError ?? nrgyReportError;

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
        onError(error);
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
  options?: TaskSchedulerOptions,
): TaskScheduler {
  const onError = options?.onError ?? nrgyReportError;

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
        onError(error);
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
