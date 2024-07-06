import { Runtime, RUNTIME } from './runtime';

describe('ENERGY_RUNTIME', () => {
  it('should be defined', () => {
    expect(RUNTIME).toBeDefined();
  });
});

describe('EnergyRuntime', () => {
  describe('updateAtomClock()', () => {
    it('should update the clock of the next atom', () => {
      const runtime = new Runtime();
      expect(runtime.clock).toBe(0);

      runtime.updateAtomClock();
      expect(runtime.clock).toBe(1);

      runtime.updateAtomClock();
      expect(runtime.clock).toBe(2);
    });
  });

  describe('runAsUntracked()', () => {
    it('should run an action as not tracked', () => {
      const runtime = new Runtime();
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
