import { expectEffectContext } from '../../test/matchers';
import { flushMicrotasks } from '../../test/testUtils';
import { getAtomNode } from '../atoms/atom';
import { compute } from '../atoms/compute';
import { atom } from '../atoms/writableAtom';
import { WritableAtomNode } from '../common/reactiveNodes';
import {
  createMicrotaskScheduler,
  createSyncTaskScheduler,
} from '../internals/schedulers';
import { getSignalNode } from '../signals/common';

import { AtomEffect } from './atomEffect';
import { effect, syncEffect } from './effect';

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
      expect(scheduler.isEmpty()).toBe(true);
    });
  });

  describe('notifyDestroy()', () => {
    it('should notify the effect that it must be destroyed', () => {
      const source = atom(1);
      const node = getAtomNode(source) as WritableAtomNode<unknown>;

      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        source,
        () => {},
      );

      effect.notifyDestroy(node);

      expect(effect.isDestroyed).toBe(true);
    });

    it('should not notify the effect if it is destroyed', () => {
      const source = atom(1);
      const node = getAtomNode(source) as WritableAtomNode<unknown>;

      const effect = new AtomEffect(
        createSyncTaskScheduler(),
        source,
        () => {},
      );

      const mockDestroy = jest.fn(effect.destroy.bind(effect));
      effect.destroy = mockDestroy;

      effect.notifyDestroy(node);
      expect(mockDestroy).toHaveBeenCalledTimes(1);

      mockDestroy.mockClear();
      effect.notifyDestroy(node);
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

describe('Change detector bugs', () => {
  test('Race in two syncEffect() and one effect()', async () => {
    const history1: number[] = [];
    const history2: number[] = [];
    const history3: number[] = [];

    const store = atom(1);
    const computed = compute(() => store());

    effect(computed, (v) => history1.push(v));
    syncEffect(computed, (v) => history2.push(v));
    effect(computed, (v) => history3.push(v));

    await flushMicrotasks();

    store.set(2);
    await flushMicrotasks();

    store.set(3);
    await flushMicrotasks();

    expect(history1).toEqual([1, 2, 3]);
    expect(history2).toEqual([1, 2, 3]);
    expect(history3).toEqual([1, 2, 3]); // Failed with [1]
  });

  test('Race in three syncEffect()', async () => {
    const history1: number[] = [];
    const history2: number[] = [];
    const history3: number[] = [];

    const store = atom(1);
    const computed = compute(() => store());

    syncEffect(computed, (v) => history1.push(v));
    syncEffect(computed, (v) => history2.push(v));
    syncEffect(computed, (v) => history3.push(v));

    store.set(2);
    store.set(3);

    expect(history1).toEqual([1, 2, 3]);
    expect(history2).toEqual([1, 2, 3]);
    expect(history3).toEqual([1, 2, 3]); // Failed with [1]
  });
});
