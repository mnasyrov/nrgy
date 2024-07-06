import { nrgyReportError } from './reportError';

jest.mock('./reportError', () => {
  (globalThis as any).reportError = undefined;

  const originalModule = jest.requireActual('./reportError');

  return {
    __esModule: true,
    ...originalModule,
  };
});

describe('nrgyReportError() polyfill', () => {
  it('should call `reportError` polyfill', () => {
    const callback = jest.fn();
    globalThis.onerror = callback;

    nrgyReportError('test error');

    expect(callback).toHaveBeenCalledTimes(0);
  });
});
