import { describe, expect, it, test, vi } from 'vitest';
import { runEffects } from '../utils/runEffects';

import {
  ATOM_SYMBOL,
  atom,
  compute,
  destroyEffect,
  type EffectNode,
  effect,
  NODE_TYPE_EFFECT,
  notifyEffect,
  runEffect,
  syncEffect,
} from './reactivity';
import type { Atom } from './types';

function createScheduler() {
  const schedule = vi.fn((task: EffectNode<any>) => task);

  return {
    isEmpty: () => true,
    schedule,
    execute: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };
}

function createEffectNode<T>(
  overrides: Partial<EffectNode<T>> = {},
): EffectNode<T> {
  return {
    action: vi.fn(),
    dirty: true,
    id: 1,
    isDestroyed: false,
    label: undefined,
    lastValueVersion: undefined,
    onDestroy: undefined,
    onError: undefined,
    ref: undefined,
    scheduler: createScheduler(),
    sourceAtom: atom(undefined as T),
    type: NODE_TYPE_EFFECT,
    ...overrides,
  };
}

describe('EffectNode internals', () => {
  describe('destroyEffect()', () => {
    it('should destroy the effect once and clear internal references', () => {
      const onDestroy = vi.fn();
      const node = createEffectNode({
        onDestroy,
        sourceAtom: atom(1),
      });

      destroyEffect(node);
      destroyEffect(node);

      expect(node.isDestroyed).toBe(true);
      expect(node.action).toBe(undefined);
      expect(node.onDestroy).toBe(undefined);
      expect(node.scheduler).toBe(undefined);
      expect(node.sourceAtom).toBe(undefined);
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('notifyEffect()', () => {
    it('should mark a clean effect as dirty and schedule it', () => {
      const scheduler = createScheduler();
      const node = createEffectNode({
        dirty: false,
        scheduler,
      });

      notifyEffect(node);

      expect(node.dirty).toBe(true);
      expect(scheduler.schedule).toHaveBeenCalledTimes(1);
      expect(scheduler.schedule).toHaveBeenCalledWith(node);
    });

    it('should do nothing for a destroyed effect', () => {
      const scheduler = createScheduler();
      const node = createEffectNode({
        dirty: false,
        isDestroyed: true,
        scheduler,
      });

      notifyEffect(node);

      expect(node.dirty).toBe(false);
      expect(scheduler.schedule).toHaveBeenCalledTimes(0);
    });

    it('should not schedule when the scheduler is not available', () => {
      const node = createEffectNode({
        dirty: false,
        scheduler: undefined,
      });

      notifyEffect(node);

      expect(node.dirty).toBe(true);
    });
  });

  describe('runEffect()', () => {
    it('should do nothing when the effect is not dirty', () => {
      const action = vi.fn();
      const node = createEffectNode({
        action,
        dirty: false,
        sourceAtom: atom(1),
      });

      runEffect(node);

      expect(action).toHaveBeenCalledTimes(0);
    });

    it('should report callback errors via onError', () => {
      const effectError = new Error('effect failed');
      const action = vi.fn(() => {
        throw effectError;
      });
      const onError = vi.fn();
      const node = createEffectNode({
        action,
        onError,
        sourceAtom: atom(1),
      });

      runEffect(node);

      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith(1);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(effectError);
    });

    it('should stop when the effect is destroyed during source evaluation', () => {
      let node!: EffectNode<number>;

      const sourceAtom = (() => {
        destroyEffect(node);
        return 1;
      }) as Atom<number>;
      (sourceAtom as any)[ATOM_SYMBOL] = { version: 0 };

      const action = vi.fn();
      node = createEffectNode({
        action,
        sourceAtom,
      });

      runEffect(node);

      expect(node.isDestroyed).toBe(true);
      expect(action).toHaveBeenCalledTimes(0);
    });
  });
});

// describe('EffectNode', () => {
//   describe('destroy()', () => {
//     it('should destroy the effect', () => {
//       const effect = createEffectNode(
//         createSyncTaskScheduler(),
//         atom(1),
//         () => {},
//       );
//       effect.destroy();
//       expect(effect.isDestroyed).toBe(true);
//     });
//
//     it('should call onDestroy signal', () => {
//       const onDestroyCallback = vi.fn();
//
//       const effect = createEffectNode(
//         createSyncTaskScheduler(),
//         atom(1),
//         () => {},
//         { onDestroy: onDestroyCallback },
//       );
//
//       effect.destroy();
//       expect(onDestroyCallback).toHaveBeenCalledTimes(1);
//     });
//   });
//
//   describe('notify()', () => {
//     it('should notify the effect', () => {
//       const scheduler = createMicrotaskScheduler();
//
//       const effect = createEffectNode(scheduler, atom(1), () => {});
//
//       effect.notify();
//       expect(effect.dirty).toBe(true);
//
//       expect(scheduler.isEmpty()).toBe(false);
//       scheduler.execute();
//       expect(scheduler.isEmpty()).toBe(true);
//     });
//
//     it('should not notify the effect if it is destroyed', () => {
//       const scheduler = createMicrotaskScheduler();
//
//       const effect = createEffectNode(scheduler, atom(1), () => {});
//       effect.destroy();
//
//       effect.notify();
//       expect(effect.dirty).toBe(false);
//       expect(scheduler.isEmpty()).toBe(true);
//     });
//   });
//
//   describe('run()', () => {
//     it('should signals onError with error of action', () => {
//       const errorCallback = vi.fn();
//       const scheduler = createSyncTaskScheduler();
//
//       const effect = createEffectNode(
//         scheduler,
//         atom(1),
//         () => {
//           throw new Error('error');
//         },
//         {
//           onError: errorCallback,
//         },
//       );
//
//       effect.dirty = true;
//       runEffect(effect);
//
//       expect(errorCallback).toHaveBeenCalledTimes(1);
//       expect(errorCallback).toHaveBeenCalledWith(new Error('error'));
//     });
//
//     it('should run the effect if it is dirty', () => {
//       const action = vi.fn();
//       const scheduler = createSyncTaskScheduler();
//
//       const effect = createEffectNode(scheduler, atom(1), action);
//
//       effect.dirty = true;
//       runEffect(effect);
//
//       expect(action).toHaveBeenCalledTimes(1);
//     });
//
//     it('should not run the effect if it is not dirty', () => {
//       const action = vi.fn();
//       const scheduler = createSyncTaskScheduler();
//
//       const effect = createEffectNode(scheduler, atom(1), action);
//
//       effect.dirty = false;
//       runEffect(effect);
//
//       expect(action).toHaveBeenCalledTimes(0);
//     });
//
//     it('should not run action if the effect is destroyed', () => {
//       const action = vi.fn();
//       const scheduler = createSyncTaskScheduler();
//
//       const effect = createEffectNode(scheduler, atom(1), action);
//
//       effect.dirty = true;
//       effect.isDestroyed = true;
//       runEffect(effect);
//       expect(action).toHaveBeenCalledTimes(0);
//     });
//   });
// });

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

    runEffects();

    store.set(2);
    runEffects();

    store.set(3);
    runEffects();

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
