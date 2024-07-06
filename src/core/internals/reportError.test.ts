import { nrgyReportError } from './reportError';

jest.mock('./reportError', () => {
  (globalThis as any).reportError = (error: any) => {
    (globalThis as any)?.onerror(error);
  };

  const originalModule = jest.requireActual('./reportError');

  return {
    __esModule: true,
    ...originalModule,
  };
});

describe('nrgyReportError()', () => {
  it('should call `reportError`', () => {
    const callback = jest.fn();
    globalThis.onerror = callback;

    nrgyReportError('test error');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith('test error');
  });
});
