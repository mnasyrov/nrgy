import { RUNTIME } from '../reactivity/runtime';

/**
 * Runs all effects that are scheduled for the next microtask
 */
export function runEffects(): void {
  RUNTIME.runEffects();
}
