# `objectEquals.ts`

## Purpose

This module provides the `objectEquals` function, which compares two objects by
their own keys and values.

## Overview

`objectEquals` is useful for computed atoms and helper APIs when the result is
a flat object. It prevents unnecessary reactive updates when the key set and
the values remain unchanged.

## Conceptual Architecture

Comparison is performed in several stages:

1. Fast exit on referential equality `objA === objB`.
2. Comparison of key array lengths.
3. Verification that every own key from `objA` exists in `objB`.
4. Comparison of each value through `defaultEquals`.

This makes the function a shallow structural equality helper rather than a
recursive deep comparison utility.

## Public API Description

### `objectEquals: ValueEqualityFn<Readonly<Record<string, unknown>>>`

- `objA`: first object to compare.
- `objB`: second object to compare.
- Returns `true` when both objects have the same own keys and equal values.

## Usage Examples

```ts
import { objectEquals } from '@nrgyjs/core';

objectEquals({ a: 1, b: 2 }, { a: 1, b: 2 }); // true
objectEquals({ a: 1 }, { a: 2 }); // false
objectEquals({ a: { x: 1 } }, { a: { x: 1 } }); // false
```

---

Translation: EN | [RU](./objectEquals.ru.md)
