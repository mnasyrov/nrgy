import { appendToList, LinkedList, popListHead } from '../internals/list';

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
 * Creates a microtask scheduler
 */
export function createMicrotaskScheduler(): TaskScheduler {
  const queue: LinkedList<() => void> = {};
  let isPlanned = false;
  let isActive = false;
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isPlanned = false;
    isActive = true;

    let action;
    while (!isPaused && (action = popListHead(queue))) {
      action();
    }

    isActive = false;
  };

  return {
    isEmpty: () => !queue.head,
    schedule: (entry) => {
      const prevEmpty = !queue.head;
      appendToList(queue, entry);

      if (prevEmpty && !isActive && !isPlanned) {
        isPlanned = true;
        queueMicrotask(execute);
      }
    },
    execute,

    pause: () => {
      isPaused = true;
    },

    resume: () => {
      isPaused = false;

      if (!isPlanned && queue.head) {
        isPaused = true;
        queueMicrotask(execute);
      }
    },
  };
}

/**
 * Creates a synchronous task scheduler
 */
export function createSyncTaskScheduler(): TaskScheduler {
  const queue: LinkedList<() => void> = {};
  let isActive = false;
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let action;
    while (!isPaused && (action = popListHead(queue))) {
      action();
    }
    isActive = false;
  };

  return {
    isEmpty: () => !queue.head,
    schedule: (entry) => {
      appendToList(queue, entry);
      if (!isActive) execute();
    },
    execute,

    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;

      if (queue.head) {
        execute();
      }
    },
  };
}
