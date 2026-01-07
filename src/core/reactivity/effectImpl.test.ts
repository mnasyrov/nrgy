import { runEffects } from '../utils/runEffects';

import { atom, compute, effect, syncEffect } from './reactivity';

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
//       const onDestroyCallback = jest.fn();
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
//       const errorCallback = jest.fn();
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
//       const action = jest.fn();
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
//       const action = jest.fn();
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
//       const action = jest.fn();
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
