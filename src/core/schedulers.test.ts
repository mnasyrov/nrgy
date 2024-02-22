import { flushMicrotasks } from '../test/testUtils';

import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';

jest.mock('./utils/reportError', () => {
  (globalThis as any).reportError = (error: any) => {
    (globalThis as any)?.onerror?.(error);
  };

  const originalModule = jest.requireActual('./utils/reportError');

  return {
    __esModule: true,
    ...originalModule,
  };
});

describe('MicrotaskScheduler', () => {
  describe('runnableAction argument', () => {
    it('should be used to for execution of tasks', async () => {
      const scheduler = createMicrotaskScheduler();
      const task = jest.fn();

      scheduler.schedule(task);
      await flushMicrotasks();

      expect(task).toBeCalledTimes(1);
    });
  });

  describe('isEmpty()', () => {
    it('should return true if execution queue is empty', async () => {
      const scheduler = createMicrotaskScheduler();
      expect(scheduler.isEmpty()).toBe(true);

      scheduler.schedule(jest.fn());
      expect(scheduler.isEmpty()).toBe(false);

      await flushMicrotasks();

      expect(scheduler.isEmpty()).toBe(true);
    });
  });

  describe('schedule()', () => {
    it('should schedule microtasks', async () => {
      const task1 = jest.fn();
      const task2 = jest.fn();
      const task3 = jest.fn();
      const tasks = [task1, task2, task3];

      const scheduler = createMicrotaskScheduler();

      tasks.forEach(scheduler.schedule);
      tasks.forEach((task) => expect(task).toBeCalledTimes(0));

      await flushMicrotasks();

      tasks.forEach((task) => expect(task).toBeCalledTimes(1));
    });
  });

  describe('execute()', () => {
    it('should execute the queue', async () => {
      const scheduler = createMicrotaskScheduler();

      scheduler.schedule(jest.fn());
      scheduler.schedule(jest.fn());
      expect(scheduler.isEmpty()).toBe(false);

      scheduler.execute();
      expect(scheduler.isEmpty()).toBe(true);
    });

    it('should do nothing if execute() is called multiple times by the scheduled task', async () => {
      const onError = jest.fn();
      const scheduler = createMicrotaskScheduler({ onError });

      const task2 = jest.fn();

      const task1 = jest.fn(() => {
        scheduler.schedule(task2);
        expect(scheduler.isEmpty()).toBe(false);

        scheduler.execute();
        scheduler.execute();
        expect(scheduler.isEmpty()).toBe(false);
      });

      scheduler.schedule(task1);

      await flushMicrotasks();

      expect(scheduler.isEmpty()).toBe(true);
      expect(task1).toBeCalledTimes(1);

      expect(onError).toHaveBeenCalledTimes(0);
    });

    it('should pass task errors to onError callback', async () => {
      const onError = jest.fn();
      const scheduler = createMicrotaskScheduler({ onError });
      const results: number[] = [];

      const task1 = () => results.push(1);
      const task2 = () => {
        throw 'error 1';
      };
      const task3 = () => results.push(2);
      const task4 = () => {
        throw 'error 2';
      };
      const task5 = () => results.push(3);

      [task1, task2, task3, task4, task5].forEach(scheduler.schedule);

      await flushMicrotasks();

      expect(onError).toHaveBeenCalledWith('error 1');
      expect(onError).toHaveBeenCalledWith('error 2');
      expect(scheduler.isEmpty()).toBe(true);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should pass task errors to reportError() if onError is not provided', async () => {
      const onError = jest.fn();
      globalThis.onerror = onError;

      const scheduler = createMicrotaskScheduler();

      scheduler.schedule(() => {
        throw 'error 1';
      });

      await flushMicrotasks();

      expect(onError).toHaveBeenCalledWith('error 1');
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SyncTaskScheduler', () => {
  describe('runnableAction argument', () => {
    it('should be used to for execution of tasks', async () => {
      const scheduler = createSyncTaskScheduler();
      const task = jest.fn();

      scheduler.schedule(task);

      expect(task).toBeCalledTimes(1);
    });
  });

  describe('isEmpty()', () => {
    it('should return true if execution queue is empty', async () => {
      const scheduler = createSyncTaskScheduler();
      expect(scheduler.isEmpty()).toBe(true);

      // Task is executed during scheduling
      scheduler.schedule(jest.fn());
      expect(scheduler.isEmpty()).toBe(true);

      // Check isEmpty() during execution of a task
      scheduler.schedule(() => {
        scheduler.schedule(jest.fn());
        expect(scheduler.isEmpty()).toBe(false);
      });

      // Finally it should be empty
      expect(scheduler.isEmpty()).toBe(true);
    });
  });

  describe('schedule()', () => {
    it('should schedule tasks', async () => {
      const task = jest.fn();

      const scheduler = createSyncTaskScheduler();
      scheduler.schedule(task);
      scheduler.schedule(task);
      scheduler.schedule(task);

      expect(task).toBeCalledTimes(3);
    });
  });

  describe('execute()', () => {
    it('should execute the queue', async () => {
      const scheduler = createSyncTaskScheduler();

      scheduler.schedule(jest.fn());
      scheduler.schedule(jest.fn());
      expect(scheduler.isEmpty()).toBe(true);
    });

    it('should do nothing if execute() is called multiple times by the scheduled task', () => {
      const onError = jest.fn();
      const scheduler = createSyncTaskScheduler({ onError });

      const task2 = jest.fn();

      const task1 = jest.fn(() => {
        scheduler.schedule(task2);
        expect(scheduler.isEmpty()).toBe(false);

        scheduler.execute();
        scheduler.execute();
        expect(scheduler.isEmpty()).toBe(false);
      });

      scheduler.schedule(task1);

      expect(scheduler.isEmpty()).toBe(true);
      expect(task1).toBeCalledTimes(1);

      expect(onError).toHaveBeenCalledTimes(0);
    });

    it('should pass task errors to onError callback', async () => {
      const onError = jest.fn();
      const scheduler = createSyncTaskScheduler({ onError });
      const results: number[] = [];

      const task1 = () => results.push(1);
      const task2 = () => {
        throw 'error 1';
      };
      const task3 = () => results.push(2);
      const task4 = () => {
        throw 'error 2';
      };
      const task5 = () => results.push(3);

      [task1, task2, task3, task4, task5].forEach(scheduler.schedule);

      await flushMicrotasks();

      expect(onError).toHaveBeenCalledWith('error 1');
      expect(onError).toHaveBeenCalledWith('error 2');
      expect(scheduler.isEmpty()).toBe(true);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should pass task errors to reportError() if onError is not provided', () => {
      const onError = jest.fn();
      globalThis.onerror = onError;

      const scheduler = createSyncTaskScheduler();

      scheduler.schedule(() => {
        throw 'error 1';
      });

      expect(onError).toHaveBeenCalledWith('error 1');
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
