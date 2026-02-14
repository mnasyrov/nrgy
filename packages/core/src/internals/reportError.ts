export const nrgyReportError =
  'reportError' in globalThis && typeof globalThis.reportError === 'function'
    ? globalThis.reportError
    : () => undefined;
