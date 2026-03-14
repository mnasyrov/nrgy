# `fastArray.ts`

## Purpose

This module provides compact mutable array structures used internally by the
reactive runtime for fast dependency and scheduler bookkeeping.

## Overview

The runtime needs allocation-light containers for observer references and task
queues. `FastArray<T>` and `FastRingBuffer<T>` provide these low-level data
structures without exposing them as part of the main public package surface.

## Conceptual Architecture

The module contains two internal structures:

1. `FastArray<T>`: an array with a logical `size` field and helpers for reset,
   dispose, and duplicate-aware push.
2. `FastRingBuffer<T>`: a cyclic queue encoding `size`, `capacity`, and `head`
   in the first slots of a tuple-backed array.

These structures are used by dependency tracking and by task schedulers to
avoid repeated array allocation and shifting overhead.

## Public API Description

### `FastArray<T>`

- Mutable array with an additional `size` field.

### `fastArray<T>(): FastArray<T>`

- Creates an empty fast array.

### `disposeFastArray<T>(array): void`

- Clears logical size and backing array storage.

### `resetFastArray<T>(array): void`

- Resets logical size without truncating allocated storage.

### `pushFastArray<T>(array, value): void`

- Appends a value using duplicate-aware fast-path logic.

### `FastRingBuffer<T>`

- Tuple-backed cyclic queue storing size, capacity, head, and values.

### `fastRingBuffer<T>(initialCapacity?): FastRingBuffer<T>`

- Creates a ring buffer with the specified or default capacity.

### `isEmptyFastRingBuffer<T>(ring): boolean`

- Returns whether the queue is empty.

### `reserveFastRingBuffer<T>(ring, minCapacity): void`

- Grows the ring buffer while preserving logical order.

### `pushFastRingBuffer<T>(ring, value): void`

- Enqueues a value at the tail.

### `shiftFastRingBuffer<T>(ring): T | undefined`

- Dequeues a value from the head.

## Usage Examples

```ts
import { fastArray, pushFastArray } from './fastArray';

const items = fastArray<number>();
pushFastArray(items, 1);
pushFastArray(items, 2);
```
