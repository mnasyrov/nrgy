import { RUNTIME } from '../reactivity/runtime';

/**
 * Run a function in a batch update context.
 *
 * It will defer all effect notifications until the function is finished.
 */
export function batch<T>(action: () => T): T {
  return RUNTIME.batch(action);
}
