export type FastArray<T> = T[] & { size: number };

export function fastArray<T>(): FastArray<T> {
  const array = [] as any as FastArray<T>;
  array.size = 0;
  return array;
}

export function disposeFastArray<T>(array: FastArray<T>): void {
  array.size = 0;
  array.length = 0;
}

export function resetFastArray<T>(array: FastArray<T>): void {
  array.size = 0;
}

export function pushFastArray<T>(array: FastArray<T>, value: T): void {
  if (array.size > 0 && array[array.size - 1] === value) {
    return;
  } else if (array.size > 0 && array[array.size] === value) {
    array.size++;
  } else {
    array[array.size++] = value;
  }
}

/**
 * FastRingBuffer encodes size, capacity, and head in the first three slots:
 * [0]=size, [1]=capacity, [2]=head, and from [3] values are stored in a cyclic manner.
 */
export type FastRingBuffer<T> = [
  size: number,
  capacity: number,
  head: number,
  ...T[],
];

/**
 * Create a ring buffer with an optional initial capacity (default 32).
 * Capacity will grow on demand.
 */
export function fastRingBuffer<T>(initialCapacity = 32): FastRingBuffer<T> {
  if (initialCapacity < 1) initialCapacity = 1;
  const ring = Array.of(0, initialCapacity, 0) as unknown as FastRingBuffer<T>;
  // Preallocate backing slots for values
  (ring as any).length = 3 + initialCapacity;
  return ring;
}

/**
 * Whether the buffer is empty.
 */
export function isEmptyFastRingBuffer<T>(ring: FastRingBuffer<T>): boolean {
  return (ring[0] | 0) === 0;
}

/**
 * Ensure at least minCapacity backing capacity; preserves logical order.
 */
export function reserveFastRingBuffer<T>(
  ring: FastRingBuffer<T>,
  minCapacity: number,
): void {
  const currentCap = ring[1] | 0;
  if (minCapacity <= currentCap) return;

  // Grow to next power-of-two >= minCapacity for amortized O(1)
  let newCap = currentCap > 0 ? currentCap : 1;
  while (newCap < minCapacity) newCap <<= 1;

  const size = ring[0] | 0;
  const oldHead = ring[2] | 0;

  // Expand underlying storage
  (ring as any).length = 3 + newCap;

  if (size > 0) {
    // Reflow items into contiguous slots starting from index 3
    for (let i = 0; i < size; i++) {
      const from = 3 + ((oldHead + i) % currentCap);
      const to = 3 + i;
      if (from !== to) {
        (ring as any)[to] = ring[from];
        (ring as any)[from] = undefined;
      }
    }
  }

  ring[2] = 0; // head
  ring[1] = newCap; // capacity
}

/**
 * Enqueue an item to the tail; grows capacity if needed.
 */
export function pushFastRingBuffer<T>(ring: FastRingBuffer<T>, value: T): void {
  const size = ring[0] | 0;
  const cap = ring[1] | 0;
  if (size === cap) {
    reserveFastRingBuffer(ring, cap > 0 ? cap << 1 : 1);
  }
  const head = ring[2] | 0;
  const capacity = ring[1] | 0;
  const tail = (head + (ring[0] | 0)) % capacity;
  (ring as any)[3 + tail] = value;
  ring[0] = (ring[0] | 0) + 1;
}

/**
 * Dequeue an item from the head; returns undefined if empty.
 */
export function shiftFastRingBuffer<T>(ring: FastRingBuffer<T>): T | undefined {
  const size = ring[0] | 0;
  if (size === 0) return undefined;
  const head = ring[2] | 0;
  const idx = 3 + head;
  const value = ring[idx] as T | undefined;
  (ring as any)[idx] = undefined; // help GC
  const capacity = ring[1] | 0;
  ring[2] = (head + 1) % capacity;
  ring[0] = size - 1;
  return value;
}
