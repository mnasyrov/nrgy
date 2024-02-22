export type QueueMicrotaskFn = (callback: () => void) => void;

export const queueMicrotaskPolyfill: QueueMicrotaskFn = (
  callback: () => void,
) => {
  Promise.resolve().then(callback);
};

export const nrgyQueueMicrotask: QueueMicrotaskFn =
  'queueMicrotask' in globalThis && globalThis['queueMicrotask']
    ? globalThis.queueMicrotask
    : queueMicrotaskPolyfill;
