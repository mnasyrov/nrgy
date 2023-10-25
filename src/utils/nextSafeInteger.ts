/**
 * Returns a next safe integer value.
 *
 * It can overflow Number.MAX_SAFE_INTEGER and starts from Number.MIN_SAFE_INTEGER.
 */
export function nextSafeInteger(value: number): number {
  return value < Number.MAX_SAFE_INTEGER ? value + 1 : Number.MIN_SAFE_INTEGER;
}
