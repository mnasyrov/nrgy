import { expectEffectContext } from '../test/matchers';

import { atom } from './atom';
import { AtomEffect, isComputedNodesChanged } from './atomEffect';
import { compute } from './compute';
import { syncEffect } from './effect';
import { ENERGY_RUNTIME, tracked } from './runtime';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from './schedulers';
import { getSignalNode } from './signal';

describe('AtomEffect', () => {
  describe('destroy()', () => {
    it('should destroy the effect', () => {
      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        atom(1),
        () => {},
      );
      effect.destroy();
      expect(effect.isDestroyed).toBe(true);
    });

    it('should call onDestroy signal', () => {
      const onDestroyCallback = jest.fn();

      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        atom(1),
        () => {},
      );
      syncEffect(effect.onDestroy, onDestroyCallback);

      effect.destroy();
      expect(onDestroyCallback).toHaveBeenCalledTimes(1);
    });

    it('should destroy onDestroy, onError, onResult signals', () => {
      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        atom(1),
        () => {},
      );

      effect.destroy();

      expect(getSignalNode(effect.onResult).isDestroyed).toBe(true);
      expect(getSignalNode(effect.onError).isDestroyed).toBe(true);
      expect(getSignalNode(effect.onDestroy).isDestroyed).toBe(true);
    });
  });

  describe('notify()', () => {
    it('should notify the effect', () => {
      const scheduler = createMicrotaskScheduler();

      const effect = new AtomEffect(scheduler, atom(1), () => {});

      effect.notify();
      expect(effect.dirty).toBe(true);
      expect(effect.clock).toBe(1);

      expect(scheduler.isEmpty()).toBe(false);
      scheduler.execute();
      expect(scheduler.isEmpty()).toBe(true);
    });

    it('should not notify the effect if it is destroyed', () => {
      const scheduler = createMicrotaskScheduler();

      const effect = new AtomEffect(scheduler, atom(1), () => {});
      effect.destroy();

      effect.notify();
      expect(effect.dirty).toBe(false);
      expect(effect.clock).toBe(0);
      expect(scheduler.isEmpty()).toBe(true);
    });
  });

  describe('notifyDestroy()', () => {
    it('should notify the effect that it must be destroyed', () => {
      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        atom(1),
        () => {},
      );

      effect.notifyDestroy();

      expect(effect.isDestroyed).toBe(true);
    });

    it('should not notify the effect if it is destroyed', () => {
      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        atom(1),
        () => {},
      );

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

      const effect = new AtomEffect(scheduler, atom(1), () => 'result');
      syncEffect(effect.onResult, resultCallback);

      effect.dirty = true;
      effect.run();

      expect(resultCallback).toHaveBeenCalledTimes(1);
      expect(resultCallback).toHaveBeenCalledWith(
        'result',
        expectEffectContext(),
      );
    });

    it('should signals onError with error of action', () => {
      const errorCallback = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, atom(1), () => {
        throw new Error('error');
      });
      syncEffect(effect.onError, errorCallback);

      effect.dirty = true;
      effect.run();

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(errorCallback).toHaveBeenCalledWith(
        new Error('error'),
        expectEffectContext(),
      );
    });

    it('should run the effect if it is dirty', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, atom(1), action);

      effect.dirty = true;
      effect.run();

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should not run the effect if it is not dirty', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, atom(1), action);

      effect.dirty = false;
      effect.run();

      expect(action).toHaveBeenCalledTimes(0);
    });

    it('should not run action if the effect is destroyed', () => {
      const action = jest.fn();
      const scheduler = createSyncTaskScheduler();

      const effect = new AtomEffect(scheduler, atom(1), action);

      effect.dirty = true;
      effect.isDestroyed = true;
      effect.run();
      expect(action).toHaveBeenCalledTimes(0);
    });

    it('should run the action if seenComputedNodes is changed', () => {
      const store = atom(1);
      const computed = compute(() => store());
      const scheduler = createSyncTaskScheduler();

      const action = jest.fn(() => tracked(computed));
      const effect = new AtomEffect(scheduler, atom(1), action);

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

  describe('Context of the action', () => {
    describe('cleanup()', () => {
      it('should be called before calling the next action', () => {
        const cleanupCallback = jest.fn();

        const scheduler = createSyncTaskScheduler();
        const source = atom(10);

        const effect = new AtomEffect(scheduler, source, (value, context) => {
          context.cleanup(() => cleanupCallback(value));
        });

        cleanupCallback.mockClear();
        effect.notify();
        expect(cleanupCallback).toHaveBeenCalledTimes(0);

        cleanupCallback.mockClear();
        source.set(11);
        effect.dirty = true;
        effect.notify();
        expect(cleanupCallback).toHaveBeenCalledTimes(1);
        expect(cleanupCallback).toHaveBeenCalledWith(10);
      });

      it('should be called when the effect is destroyed', () => {
        const cleanupCallback = jest.fn();

        const scheduler = createSyncTaskScheduler();
        const source = atom(10);

        const effect = new AtomEffect(scheduler, source, (_value, context) => {
          context.cleanup(cleanupCallback);
        });

        cleanupCallback.mockClear();
        effect.notify();
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
