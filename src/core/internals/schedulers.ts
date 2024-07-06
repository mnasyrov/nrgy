import { createQueue } from './queue';
import { nrgyReportError } from './reportError';

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

  /** Pause the queue */
  pause(): void;

  /** Resume the queue */
  resume(): void;
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
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let action;
    while (!isPaused && (action = queue.get())) {
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

    pause: () => {
      isPaused = true;
    },

    resume: () => {
      isPaused = false;

      if (!queue.isEmpty()) {
        queueMicrotask(execute);
      }
    },
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
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let action;
    while (!isPaused && (action = queue.get())) {
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

    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;

      if (!queue.isEmpty()) {
        execute();
      }
    },
  };
}
