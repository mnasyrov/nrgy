import { RUNTIME } from '../reactivity/reactivity';

/**
 * Runs all effects that are scheduled for the next microtask
 */
export function runEffects(): void {
  RUNTIME.runEffects();
}
