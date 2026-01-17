export type FastArray<T> = [size: number, ...T[]];

export function fastArray<T>(initialSize: number): FastArray<T> {
  const array: FastArray<T> = new Array<T>(1 + initialSize) as any;
  array[0] = 0;
  return array;
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
