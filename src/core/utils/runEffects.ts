import { RUNTIME } from '../internals/runtime';

/**
 * Runs all effects which are scheduled for the next microtask
 */
export function runEffects(): void {
  RUNTIME.asyncScheduler.execute();
}
