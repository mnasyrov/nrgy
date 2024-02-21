export type ScheduleMicrotaskFn = (callback: () => void) => void;

export const queueMicrotaskPolyfill: ScheduleMicrotaskFn = (
  callback: () => void,
) => {
  Promise.resolve().then(callback);
};

export const scheduleMicrotask: ScheduleMicrotaskFn =
  'queueMicrotask' in globalThis && globalThis['queueMicrotask']
    ? globalThis.queueMicrotask
    : queueMicrotaskPolyfill;
