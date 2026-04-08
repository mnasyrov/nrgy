import { RUNTIME } from '../reactivity/reactivity';

/**
 * Runs a function outside the current tracked reactive context.
 */
export function runAsUntracked<T>(action: () => T): T {
  return RUNTIME.runAsUntracked(action);
}
