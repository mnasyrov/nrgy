import { ENERGY_RUNTIME } from './runtime';

/**
 * Run a function in a batch update context.
 *
 * It will defer all effect notifications until the function is finished.
 */
export function batch(action: () => any): void {
  ENERGY_RUNTIME.batch(action);
}
