# `mapAtom.ts`

## Purpose

This module provides `mapAtom()`, a utility for creating a computed atom from a
single source atom and a mapping function.

## Overview

`mapAtom()` simplifies one-step derived values without requiring a manual
`compute()` call. It is useful for local value transformations where there is
exactly one source and the result should remain read-only.

## Conceptual Architecture

The function is a thin wrapper over `compute()`: it reads `source()` and passes
the value into the user-provided `computation`. Optional `ComputeOptions` are
forwarded directly to `compute()`.

## Public API Description

### `mapAtom<T>(source, computation, options?): Atom<T>`

- `source`: source `Atom<T>`.
- `computation`: value transformation function.
- `options`: computed atom options.
- Returns a new computed atom with the mapped result.

## Usage Examples

```ts
import { atom, mapAtom } from '@nrgyjs/core';

const cents = atom(2500);
const dollars = mapAtom(cents, (value) => value / 100);

console.log(dollars()); // 25
```

