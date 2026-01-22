import {
  fastRingBuffer,
  isEmptyFastRingBuffer,
  pushFastRingBuffer,
  shiftFastRingBuffer,
} from './fastArray';

/**
 * Task scheduler interface
 */
export type TaskScheduler<Task> = Readonly<{
  /** Check if the execution queue is empty */
  isEmpty(): boolean;

  /** Schedule a task */
  schedule(task: Task): void;

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
export function createMicrotaskScheduler<Task>(
  taskExecutor: (task: Task) => void,
): TaskScheduler<Task> {
  const queue = fastRingBuffer<Task>();
  let isPlanned = false;
  let isActive = false;
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isPlanned = false;
    isActive = true;

    let task;
    while (!isPaused && (task = shiftFastRingBuffer(queue))) {
      taskExecutor(task);
    }

    isActive = false;
  };

  return {
    isEmpty: () => isEmptyFastRingBuffer(queue),
    schedule: (task) => {
      const prevEmpty = isEmptyFastRingBuffer(queue);
      pushFastRingBuffer(queue, task);

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
export function createSyncTaskScheduler<Task>(
  taskExecutor: (task: Task) => void,
): TaskScheduler<Task> {
  const queue = fastRingBuffer<Task>();
  let isActive = false;
  let isPaused = false;

  const execute = () => {
    if (isActive) return;

    isActive = true;

    let task;
    while (!isPaused && (task = shiftFastRingBuffer(queue))) {
      taskExecutor(task);
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
