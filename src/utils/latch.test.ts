import { createLatch } from './latch';

describe('Latch', () => {
  describe('Latch.resolve()', () => {
    it('should resolve the promise of Latch', async () => {
      const latch = createLatch<number>();
      latch.resolve(1);
      await expect(latch.promise).resolves.toBe(1);
    });
  });

  describe('Latch.reject()', () => {
    it('should reject the promise of Latch', async () => {
      const latch = createLatch<number>();
      latch.reject('test error');
      await expect(latch.promise).rejects.toBe('test error');
    });
  });
});
