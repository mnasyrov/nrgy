import { atom } from './atom';
import { AtomEffect, isComputedNodesChanged } from './atomEffect';
import { compute } from './compute';
import { syncEffect } from './effect';
import { ENERGY_RUNTIME } from './runtime';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';
import { getSignalNode } from './signal';

describe('AtomEffect', () => {
  describe('destroy()', () => {
    it('should destroy the effect', () => {
      const effect = new AtomEffect(createSyncTaskScheduler(), () => {});
      effect.destroy();
      expect(effect.isDestroyed).toBe(true);
    });

    it('should call onDestroy signal', () => {
      const onDestroyCallback = jest.fn();

      const effect = new AtomEffect(createSyncTaskScheduler(), () => {});
      syncEffect(effect.onDestroy, onDestroyCallback);

      effect.destroy();
      expect(onDestroyCallback).toHaveBeenCalledTimes(1);
    });

    it('should destroy onDestroy, onError, onResult signals', () => {
      const effect = new AtomEffect(createSyncTaskScheduler(), () => {});

      effect.destroy();

      expect(getSignalNode(effect.onResult).isDestroyed).toBe(true);
      expect(getSignalNode(effect.onError).isDestroyed).toBe(true);
      expect(getSignalNode(effect.onDestroy).isDestroyed).toBe(true);
    });
  });

  describe('notify()', () => {
    it('should notify the effect', () => {
      const scheduler = createMicrotaskScheduler();

      const effect = new AtomEffect(scheduler, () => {});

      effect.notify();
      expect(effect.dirty).toBe(true);
      expect(effect.clock).toBe(1);

      expect(scheduler.isEmpty()).toBe(false);
      scheduler.execute();
      expect(scheduler.isEmpty()).toBe(true);
    });

    it('should not notify the effect if it is destroyed', () => {
      const scheduler = createMicrotaskScheduler();

      const effect = new AtomEffect(scheduler, () => {});
      effect.destroy();

      effect.notify();
      expect(effect.dirty).toBe(false);
      expect(effect.clock).toBe(0);
      expect(scheduler.isEmpty()).toBe(true);
    });
  });

  describe('notifyDestroy()', () => {
    it('should notify the effect that it must be destroyed', () => {
      const effect = new AtomEffect(createSyncTaskScheduler(), () => {});

      effect.notifyDestroy();

      expect(effect.isDestroyed).toBe(true);
    });

    it('should not notify the effect if it is destroyed', () => {
      const effect = new AtomEffect(createSyncTaskScheduler(), () => {});

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

      const effect = new AtomEffect(scheduler, () => 'result');
      syncEffect(effect.onResult, resultCallback);

      effect.dirty = true;
      effect.run();

      expect(resultCallback).toHaveBeenCalledTimes(1);
      expect(resultCallback).toHaveBeenCalledWith('result');
    });

    it('should signals onError with error of action', () => {
      const errorCallback = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, () => {
        throw new Error('error');
      });
      syncEffect(effect.onError, errorCallback);

      effect.dirty = true;
      effect.run();

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(errorCallback).toHaveBeenCalledWith(new Error('error'));
    });

    it('should run the effect if it is dirty', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, action);

      effect.dirty = true;
      effect.run();

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should run the effect if it is not dirty', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, action);

      effect.dirty = false;
      effect.run();

      expect(action).toHaveBeenCalledTimes(0);
    });

    it('should not run action if the effect is destroyed', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, action);

      effect.dirty = true;
      effect.isDestroyed = true;
      effect.run();
      expect(action).toHaveBeenCalledTimes(0);
    });

    it('should run the action if seenComputedNodes is changed', () => {
      const store = atom(1);
      const computed = compute(() => store());
      const scheduler = createSyncTaskScheduler();

      const action = jest.fn(() => computed());
      const effect = new AtomEffect(scheduler, action);

      effect.notify();
      expect(action).toHaveBeenCalledTimes(1);

      store.set(2);
      action.mockClear();
      effect.notify();
      expect(action).toHaveBeenCalledTimes(1);

      ENERGY_RUNTIME.updateAtomClock();
      action.mockClear();
      effect.notify();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });
});

describe('isComputedNodesChanged()', () => {
  it('should return true if there are no computed nodes', () => {
    expect(isComputedNodesChanged([])).toBe(true);
  });

  it('should return false if there are no changed computed nodes', () => {
    expect(isComputedNodesChanged([{ isChanged: () => false } as any])).toBe(
      false,
    );
  });

  it('should return true if there are changed computed nodes', () => {
    expect(isComputedNodesChanged([{ isChanged: () => true } as any])).toBe(
      true,
    );
  });

  it('should return true if there are changed computed nodes', () => {
    expect(
      isComputedNodesChanged([
        { isChanged: () => true } as any,
        { isChanged: () => false } as any,
      ]),
    ).toBe(true);
  });
});
