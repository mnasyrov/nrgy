import {
  fastRingBuffer,
  isEmptyFastRingBuffer,
  pushFastRingBuffer,
  shiftFastRingBuffer,
} from './fastArray';

type ScheduledCallback = () => void;

/**
 * Task scheduler interface
 */
export type TaskScheduler = Readonly<{
  /** Check if the execution queue is empty */
  isEmpty(): boolean;

  /** Schedule a task */
  schedule(action: ScheduledCallback): void;

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
  const queue = fastRingBuffer<ScheduledCallback>();
  let isPlanned = false;
  let isActive = false;
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isPlanned = false;
    isActive = true;

    let action;
    while (!isPaused && (action = shiftFastRingBuffer(queue))) {
      action();
    }

    isActive = false;
  };

  return {
    isEmpty: () => isEmptyFastRingBuffer(queue),
    schedule: (entry) => {
      const prevEmpty = isEmptyFastRingBuffer(queue);
      pushFastRingBuffer(queue, entry);

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

      if (!isPlanned && !isEmptyFastRingBuffer(queue)) {
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
  const queue = fastRingBuffer<ScheduledCallback>();
  let isActive = false;
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let action;
    while (!isPaused && (action = shiftFastRingBuffer(queue))) {
      action();
    }
    isActive = false;
  };

  return {
    isEmpty: () => isEmptyFastRingBuffer(queue),
    schedule: (entry) => {
      pushFastRingBuffer(queue, entry);
      if (!isActive) execute();
    },
    execute,

    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;

      if (!isEmptyFastRingBuffer(queue)) {
        execute();
      }
    },
  };
}
