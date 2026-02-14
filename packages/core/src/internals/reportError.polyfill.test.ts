import { describe, expect, it, vi } from 'vitest';
import { nrgyReportError } from './reportError';

vi.mock('./reportError', async () => {
  (globalThis as any).reportError = undefined;

  const originalModule = await vi.importActual<any>('./reportError');

  return {
    __esModule: true,
    ...originalModule,
  };
});

describe('nrgyReportError() polyfill', () => {
  it('should call `reportError` polyfill', () => {
    const callback = vi.fn();
    globalThis.onerror = callback;

    nrgyReportError('test error');

    expect(callback).toHaveBeenCalledTimes(0);
  });
});
