import { AtomEffectNode } from './common';
import { ENERGY_RUNTIME, EnergyRuntime, runEffects } from './runtime';

describe('ENERGY_RUNTIME', () => {
  it('should be defined', () => {
    expect(ENERGY_RUNTIME).toBeDefined();
  });
});

describe('runEffects()', () => {
  it('should runs all effects which are scheduled for the next microtask', () => {
    const spy = jest.fn();

    ENERGY_RUNTIME.asyncScheduler.schedule(() => spy());
    expect(spy).toHaveBeenCalledTimes(0);

    runEffects();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('EnergyRuntime', () => {
  describe('updateAtomClock()', () => {
    it('should update the clock of the next atom', () => {
      const runtime = new EnergyRuntime();
      expect(runtime.clock).toBe(0);

      runtime.updateAtomClock();
      expect(runtime.clock).toBe(1);

      runtime.updateAtomClock();
      expect(runtime.clock).toBe(2);
    });
  });

  describe('getTrackedEffects()', () => {
    it('should return the list of tracked effects', () => {
      const runtime = new EnergyRuntime();
      expect(runtime.getTrackedEffects()).toEqual([]);

      runtime.setCurrentEffect({} as any);
      expect(runtime.getTrackedEffects()).toEqual([{} as any]);
    });
  });

  describe('getCurrentEffect()', () => {
    it('should return the current effect', () => {
      const runtime = new EnergyRuntime();
      expect(runtime.getCurrentEffect()).toBeUndefined();

      runtime.setCurrentEffect({} as any);
      expect(runtime.getCurrentEffect()).toEqual({} as any);
    });
  });

  describe('setCurrentEffect()', () => {
    it('should set the current effect', () => {
      const effect1: AtomEffectNode = { name: 1 } as any;
      const effect2: AtomEffectNode = { name: 2 } as any;

      const runtime = new EnergyRuntime();

      expect(runtime.setCurrentEffect(effect1)).toBeUndefined();
      expect(runtime.getTrackedEffects()).toEqual([effect1]);

      expect(runtime.setCurrentEffect(effect2)).toEqual(effect1);
      expect(runtime.getTrackedEffects()).toEqual([effect1, effect2]);

      expect(runtime.setCurrentEffect(undefined)).toEqual(effect2);
      expect(runtime.getTrackedEffects()).toEqual([]);

      expect(runtime.setCurrentEffect(undefined)).toEqual(undefined);
      expect(runtime.getTrackedEffects()).toEqual([]);
    });
  });

  describe('getVisitedComputedNodes()', () => {
    it('should return the list of visited computed nodes', () => {
      const runtime = new EnergyRuntime();
      expect(runtime.getVisitedComputedNodes()).toEqual([]);

      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([]);

      runtime.setCurrentEffect({} as any);
      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([{} as any]);
    });
  });

  describe('resetVisitedComputedNodes()', () => {
    it('should reset the list of visited computed nodes', () => {
      const runtime = new EnergyRuntime();

      runtime.setCurrentEffect({} as any);
      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([{} as any]);

      runtime.resetVisitedComputedNodes();
      expect(runtime.getVisitedComputedNodes()).toEqual([]);
    });
  });

  describe('visitComputedNode()', () => {
    it('should add the computed node to the list of visited only if the current effect is set ', () => {
      const runtime = new EnergyRuntime();

      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([]);

      runtime.setCurrentEffect({} as any);
      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([{} as any]);
    });
  });
});
