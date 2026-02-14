import { describe, expect, it } from 'vitest';
import { RUNTIME, Runtime } from './reactivity';

describe('ENERGY_RUNTIME', () => {
  it('should be defined', () => {
    expect(RUNTIME).toBeDefined();
  });
});

describe('Runtime', () => {
  describe('runAsUntracked()', () => {
    it('should run an action as not tracked', () => {
      const runtime = new Runtime();
      const mockedObserver = {} as any;
      runtime.activeObserver = mockedObserver;

      const result = runtime.runAsUntracked(() => {
        expect(runtime.activeObserver).toBeUndefined();
        return 'bar';
      });

      expect(runtime.activeObserver).toBe(mockedObserver);

      expect(result).toEqual('bar');
    });
  });
});
