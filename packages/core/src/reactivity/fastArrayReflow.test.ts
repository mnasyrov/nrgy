import { describe, expect, it } from 'vitest';
import {
  fastRingBuffer,
  pushFastRingBuffer,
  reserveFastRingBuffer,
  shiftFastRingBuffer,
} from './fastArray';

describe('reserveFastRingBuffer correctness when wrapped', () => {
  it('preserves logical order after grow from wrapped layout (cap=2)', () => {
    const ring = fastRingBuffer<number>(2);

    // Fill, shift, wrap
    pushFastRingBuffer(ring, 1);
    pushFastRingBuffer(ring, 2);
    expect(shiftFastRingBuffer(ring)).toBe(1); // head -> 1

    // Push 3: wraps to index 0
    pushFastRingBuffer(ring, 3);

    // Trigger growth via reserve
    reserveFastRingBuffer(ring, 4);

    // Drain — must yield [2, 3] in logical order
    expect(shiftFastRingBuffer(ring)).toBe(2);
    expect(shiftFastRingBuffer(ring)).toBe(3);
    expect(shiftFastRingBuffer(ring)).toBeUndefined();
  });

  it('preserves logical order after grow from wrapped layout (cap=4)', () => {
    const ring = fastRingBuffer<number>(4);

    pushFastRingBuffer(ring, 1);
    pushFastRingBuffer(ring, 2);
    pushFastRingBuffer(ring, 3);
    pushFastRingBuffer(ring, 4);

    expect(shiftFastRingBuffer(ring)).toBe(1);
    expect(shiftFastRingBuffer(ring)).toBe(2);

    pushFastRingBuffer(ring, 5);
    pushFastRingBuffer(ring, 6);

    // Now logical queue is [3, 4, 5, 6], head=2, size=4
    // Trigger growth
    reserveFastRingBuffer(ring, 8);

    expect(shiftFastRingBuffer(ring)).toBe(3);
    expect(shiftFastRingBuffer(ring)).toBe(4);
    expect(shiftFastRingBuffer(ring)).toBe(5);
    expect(shiftFastRingBuffer(ring)).toBe(6);
    expect(shiftFastRingBuffer(ring)).toBeUndefined();
  });

  it('preserves logical order under repeated push beyond capacity from wrapped state', () => {
    const ring = fastRingBuffer<number>(2);

    // Wrap the buffer
    pushFastRingBuffer(ring, 1);
    pushFastRingBuffer(ring, 2);
    shiftFastRingBuffer(ring);
    pushFastRingBuffer(ring, 3); // [2, 3] head=1

    // Push more — will trigger growth from wrapped state
    pushFastRingBuffer(ring, 4);
    pushFastRingBuffer(ring, 5);
    pushFastRingBuffer(ring, 6);

    // Expected order: 2, 3, 4, 5, 6
    expect(shiftFastRingBuffer(ring)).toBe(2);
    expect(shiftFastRingBuffer(ring)).toBe(3);
    expect(shiftFastRingBuffer(ring)).toBe(4);
    expect(shiftFastRingBuffer(ring)).toBe(5);
    expect(shiftFastRingBuffer(ring)).toBe(6);
    expect(shiftFastRingBuffer(ring)).toBeUndefined();
  });
});
