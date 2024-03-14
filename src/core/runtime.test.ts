import { AtomEffectNode } from './common';
import {
  ENERGY_RUNTIME,
  EnergyRuntime,
  runEffects,
  tracked,
  untracked,
} from './runtime';

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
      runtime.tracked = true;
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
      runtime.tracked = true;

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
      runtime.tracked = true;

      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([]);

      runtime.setCurrentEffect({} as any);
      runtime.visitComputedNode({} as any);
      expect(runtime.getVisitedComputedNodes()).toEqual([{} as any]);
    });
  });

  describe('runAsTracked()', () => {
    it('should run an action as tracked', () => {
      const runtime = new EnergyRuntime();

      expect(runtime.tracked).toBe(false);

      const spy = jest.fn();
      const result = runtime.runAsTracked(() => {
        spy(runtime.tracked);
        return 'bar';
      });

      expect(runtime.tracked).toBe(false);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(true);
      expect(result).toEqual('bar');
    });
  });

  describe('runAsUntracked()', () => {
    it('should run an action as not tracked', () => {
      const runtime = new EnergyRuntime();
      runtime.tracked = true;

      const spy = jest.fn();
      const result = runtime.runAsUntracked(() => {
        spy(runtime.tracked);
        return 'bar';
      });

      expect(runtime.tracked).toBe(true);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(false);
      expect(result).toEqual('bar');
    });
  });
});

describe('tracked()', () => {
  it('should act the same as `EnergyRuntime.runAsTracked`', () => {
    expect(ENERGY_RUNTIME.tracked).toBe(false);

    const spy = jest.fn();
    const result = tracked(() => {
      spy(ENERGY_RUNTIME.tracked);
      return 'bar';
    });

    expect(ENERGY_RUNTIME.tracked).toBe(false);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(true);
    expect(result).toEqual('bar');
  });
});

describe('untracked()', () => {
  it('should act the same as `EnergyRuntime.runAsUntracked`', () => {
    ENERGY_RUNTIME.runAsTracked(() => {
      expect(ENERGY_RUNTIME.tracked).toBe(true);

      const spy = jest.fn();
      const result = untracked(() => {
        spy(ENERGY_RUNTIME.tracked);
        return 'bar';
      });

      expect(ENERGY_RUNTIME.tracked).toBe(true);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(false);
      expect(result).toEqual('bar');
    });
  });
});
