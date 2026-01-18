export type FastArray<T> = [size: number, ...T[]];

export function fastArray<T>(): FastArray<T> {
  return Array.of(0) as any;
}

export function disposeFastArray<T>(array: FastArray<T>): void {
  array[0] = 0;
  array.length = 1;
}

export function resetFastArray<T>(array: FastArray<T>): void {
  array[0] = 0;
}

export function pushFastArray<T>(array: FastArray<T>, value: T): void {
  array[0]++;
  array[array[0]] = value;
}
