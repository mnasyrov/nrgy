import { expectEffectContext } from '../../test/matchers';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from '../internals/schedulers';
import { getSignalNode } from '../signals/common';

import { syncEffect } from './effect';
import { SignalEffect } from './signalEffect';

describe('SignalEffect', () => {
  describe('destroy()', () => {
    it('should destroy the effect', () => {
      const effect = new SignalEffect(createSyncTaskScheduler(), () => {});
      effect.destroy();
      expect(effect.isDestroyed).toBe(true);
    });

    it('should call onDestroy signal', () => {
      const onDestroyCallback = jest.fn();

      const effect = new SignalEffect(createSyncTaskScheduler(), () => {});
      syncEffect(effect.onDestroy, onDestroyCallback);

      effect.destroy();
      expect(onDestroyCallback).toHaveBeenCalledTimes(1);
    });

    it('should destroy onDestroy, onError, onResult signals', () => {
      const effect = new SignalEffect(createSyncTaskScheduler(), () => {});

      effect.destroy();

      expect(getSignalNode(effect.onResult).isDestroyed).toBe(true);
      expect(getSignalNode(effect.onError).isDestroyed).toBe(true);
      expect(getSignalNode(effect.onDestroy).isDestroyed).toBe(true);
    });
  });

  describe('notify()', () => {
    it('should notify the effect', () => {
      const scheduler = createMicrotaskScheduler();
      const action = jest.fn();

      const effect = new SignalEffect(scheduler, action);

      effect.notify(1);
      expect(action).toHaveBeenCalledTimes(0);

      expect(scheduler.isEmpty()).toBe(false);
      scheduler.execute();
      expect(scheduler.isEmpty()).toBe(true);

      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith(1, expectEffectContext());
    });

    it('should not notify the effect if it is destroyed', () => {
      const scheduler = createSyncTaskScheduler();
      const action = jest.fn();

      const effect = new SignalEffect(scheduler, action);
      effect.destroy();

      effect.notify(1);
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  describe('notifyDestroy()', () => {
    it('should notify the effect that it must be destroyed', () => {
      const effect = new SignalEffect(createSyncTaskScheduler(), () => {});

      effect.notifyDestroy();

      expect(effect.isDestroyed).toBe(true);
    });

    it('should not notify the effect if it is destroyed', () => {
      const effect = new SignalEffect(createSyncTaskScheduler(), () => {});

      const mockDestroy = jest.fn(effect.destroy.bind(effect));
      effect.destroy = mockDestroy;

      effect.notifyDestroy();
      expect(mockDestroy).toHaveBeenCalledTimes(1);

      mockDestroy.mockClear();
      effect.notifyDestroy();
      expect(mockDestroy).toHaveBeenCalledTimes(0);
    });
  });

  describe('run()', () => {
    it('should signals onResult with result of action', () => {
      const resultCallback = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new SignalEffect(scheduler, () => 'result');
      syncEffect(effect.onResult, resultCallback);

      effect.notify(undefined);

      expect(resultCallback).toHaveBeenCalledTimes(1);
      expect(resultCallback).toHaveBeenCalledWith(
        'result',
        expectEffectContext(),
      );
    });

    it('should signals onError with error of action', () => {
      const errorCallback = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new SignalEffect(scheduler, () => {
        throw new Error('error');
      });
      syncEffect(effect.onError, errorCallback);

      effect.notify(undefined);

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(errorCallback).toHaveBeenCalledWith(
        new Error('error'),
        expectEffectContext(),
      );
    });

    it('should not run action if the effect is destroyed', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new SignalEffect(scheduler, action);
      effect.destroy();

      effect.run(undefined);
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  describe('Context of the action', () => {
    describe('cleanup()', () => {
      it('should be called before calling the next action', () => {
        const cleanupCallback = jest.fn();
        const scheduler = createSyncTaskScheduler();

        const effect = new SignalEffect(scheduler, (value, context) => {
          context.cleanup(() => cleanupCallback(value));
        });

        cleanupCallback.mockClear();
        effect.run(10);
        expect(cleanupCallback).toHaveBeenCalledTimes(0);

        cleanupCallback.mockClear();
        effect.run(11);
        expect(cleanupCallback).toHaveBeenCalledTimes(1);
        expect(cleanupCallback).toHaveBeenCalledWith(10);
      });

      it('should be called when the effect is destroyed', () => {
        const cleanupCallback = jest.fn();
        const scheduler = createSyncTaskScheduler();

        const effect = new SignalEffect(scheduler, (_value, context) => {
          context.cleanup(cleanupCallback);
        });

        cleanupCallback.mockClear();
        effect.run(10);
        expect(cleanupCallback).toHaveBeenCalledTimes(0);

        cleanupCallback.mockClear();
        effect.destroy();
        expect(cleanupCallback).toHaveBeenCalledTimes(1);

        cleanupCallback.mockClear();
        effect.destroy();
        expect(cleanupCallback).toHaveBeenCalledTimes(0);
      });
    });
  });
});
