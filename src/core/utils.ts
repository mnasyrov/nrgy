export type AnyObject = Record<string, any>;

export function nextSafeInteger(currentValue: number): number {
  return currentValue < Number.MAX_SAFE_INTEGER
    ? currentValue + 1
    : Number.MIN_SAFE_INTEGER;
}
