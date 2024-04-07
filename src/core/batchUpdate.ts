import { ENERGY_RUNTIME } from './runtime';

export function batchUpdate(action: () => any): void {
  ENERGY_RUNTIME.batchUpdate(action);
}
