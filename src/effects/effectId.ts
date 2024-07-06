import { nextSafeInteger } from '../core/internals/nextSafeInteger';

let EFFECT_ID: number = 0;

/**
 * @internal
 */
export function generateEffectId(): number {
  return (EFFECT_ID = nextSafeInteger(EFFECT_ID));
}
