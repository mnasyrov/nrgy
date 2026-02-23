import { describe, expect, it } from 'vitest';
import {
  fastArray,
  fastRingBuffer,
  isEmptyFastRingBuffer,
  pushFastArray,
  pushFastRingBuffer,
  reserveFastRingBuffer,
  shiftFastRingBuffer,
} from './fastArray';

/** Helpers to introspect internals in tests */
const size = (ring: any) => ring[0] | 0;
const cap = (ring: any) => ring[1] | 0;
const head = (ring: any) => ring[2] | 0;
const at = (ring: any, i: number) => ring[3 + i];

describe('fastArray', () => {
  it('pushFastArray should deduplicate consecutive duplicates', () => {
    const a = fastArray<number>();
    expect(a.size).toBe(0);

    pushFastArray(a, 1);
    pushFastArray(a, 1); // dedup
    pushFastArray(a, 2);
    pushFastArray(a, 2); // dedup

    expect(a.size).toBe(2);
    expect([a[0], a[1]]).toEqual([1, 2]);
  });
});

describe('fastRingBuffer', () => {
  it('should normalize initial capacity to at least 1 and preallocate', () => {
    const ring = fastRingBuffer<number>(0);
    // capacity is stored at index 1 and length is 3 + capacity
    expect((ring as any)[1]).toBeGreaterThanOrEqual(1);
    expect((ring as any).length).toBe(3 + ((ring as any)[1] | 0));
  });
  it('should enqueue/dequeue and grow capacity', () => {
    const ring = fastRingBuffer<number>(1);
    expect(isEmptyFastRingBuffer(ring)).toBe(true);

    pushFastRingBuffer(ring, 10);
    expect(isEmptyFastRingBuffer(ring)).toBe(false);
    expect(size(ring)).toBe(1);
    expect(cap(ring)).toBeGreaterThanOrEqual(1);

    // Force growth
    pushFastRingBuffer(ring, 20);
    expect(size(ring)).toBe(2);
    expect(cap(ring)).toBeGreaterThanOrEqual(2);

    expect(shiftFastRingBuffer(ring)).toBe(10);
    expect(shiftFastRingBuffer(ring)).toBe(20);
    expect(shiftFastRingBuffer(ring)).toBeUndefined();
  });

  it('should reflow on reserve when wrapped (coverage of reflow path)', () => {
    const ring = fastRingBuffer<number>(2);

    // Fill and wrap
    pushFastRingBuffer(ring, 1);
    pushFastRingBuffer(ring, 2);
    expect(size(ring)).toBe(2);
    expect(head(ring)).toBe(0);

    expect(shiftFastRingBuffer(ring)).toBe(1); // head -> 1
    expect(head(ring)).toBe(1);

    // Now tail will wrap to index 0 (mod 2)
    pushFastRingBuffer(ring, 3);
    expect(size(ring)).toBe(2);

    // Reserve more to trigger reflow from wrapped layout
    reserveFastRingBuffer(ring, 4);
    expect(cap(ring)).toBeGreaterThanOrEqual(4);
    expect(head(ring)).toBe(0);
    expect(size(ring)).toBe(2);

    // Shift twice to drain without asserting order/values (goal: cover code paths)
    shiftFastRingBuffer(ring);
    shiftFastRingBuffer(ring);
    expect(size(ring)).toBe(0);
  });
});

describe('reserveFastRingBuffer branches', () => {
  it('should early-return when minCapacity <= currentCap', () => {
    const ring = fastRingBuffer<number>(4);
    // Fill a bit
    pushFastRingBuffer(ring, 1);
    pushFastRingBuffer(ring, 2);

    const prevCap = cap(ring);
    const prevHead = head(ring);
    const prevSize = size(ring);

    // Equal to current capacity
    reserveFastRingBuffer(ring, prevCap);
    expect(cap(ring)).toBe(prevCap);
    expect(head(ring)).toBe(prevHead);
    expect(size(ring)).toBe(prevSize);

    // Less than current capacity
    reserveFastRingBuffer(ring, prevCap - 1);
    expect(cap(ring)).toBe(prevCap);
    expect(head(ring)).toBe(prevHead);
    expect(size(ring)).toBe(prevSize);
  });

  it('should grow without reflow when size == 0', () => {
    const ring = fastRingBuffer<number>(2);
    expect(size(ring)).toBe(0);

    const prevHead = head(ring);
    reserveFastRingBuffer(ring, 8);

    expect(cap(ring)).toBeGreaterThanOrEqual(8);
    expect(head(ring)).toBe(0); // head resets to 0
    expect(size(ring)).toBe(0);
  });
});
