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

  describe('getCurrentEffect()', () => {
    it('should return the current effect', () => {
      const runtime = new EnergyRuntime();
      expect(runtime.getCurrentEffect()).toBeUndefined();

      runtime.setCurrentEffect({} as any);
      expect(runtime.getCurrentEffect()).toEqual({} as any);
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
