# `nextSafeInteger.ts`

## Purpose

This module provides `nextSafeInteger()`, a helper for incrementing identifiers
while staying inside JavaScript's safe integer range.

## Overview

The runtime uses monotonically changing numeric identifiers for internal nodes.
`nextSafeInteger()` increments the current value until it reaches
`Number.MAX_SAFE_INTEGER`, then wraps to `Number.MIN_SAFE_INTEGER`.

## Conceptual Architecture

The function implements a simple wrap-around rule:

1. If the current value is below `Number.MAX_SAFE_INTEGER`, increment it.
2. Otherwise, restart from `Number.MIN_SAFE_INTEGER`.

This avoids overflow into unsafe integer values while preserving a deterministic
sequence.

## Public API Description

### `nextSafeInteger(value: number): number`

- `value`: current integer identifier.
- Returns the next safe integer, wrapping after `MAX_SAFE_INTEGER`.

## Usage Examples

```ts
import { nextSafeInteger } from './nextSafeInteger';

nextSafeInteger(1); // 2
nextSafeInteger(Number.MAX_SAFE_INTEGER); // Number.MIN_SAFE_INTEGER
```

---

Translation: EN | [RU](./nextSafeInteger.ru.md)
