import { describe, expect, it, vi } from 'vitest';
import { nrgyReportError } from './reportError';

vi.mock('./reportError', async () => {
  (globalThis as any).reportError = (error: any) => {
    (globalThis as any)?.onerror(error);
  };

  const originalModule = await vi.importActual<any>('./reportError');

  return {
    __esModule: true,
    ...originalModule,
  };
});

describe('nrgyReportError()', () => {
  it('should call `reportError`', () => {
    const callback = vi.fn();
    globalThis.onerror = callback;

    nrgyReportError('test error');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith('test error');
  });
});
