# `mergeAtoms.ts`

## Purpose

This module provides `mergeAtoms()`, a utility for combining several atoms into
a single computed result.

## Overview

`mergeAtoms()` is useful when a derived value depends on multiple sources and
the caller wants a compact API instead of manually writing
`compute(() => ...)`. The function accepts a list of atoms and an explicit
combination function.

## Conceptual Architecture

The implementation is built on `compute()`:

1. Each read of the derived atom reads all input atoms.
2. Values are collected in their original tuple order.
3. The user-supplied `computation` receives the unpacked values and returns the
   final result.

Tuple typing through `TValues` preserves precise types for all arguments.

## Public API Description

### `mergeAtoms<TValues, TResult>(sources, computation, options?): Atom<TResult>`

- `sources`: tuple of input atoms.
- `computation`: function combining the input values.
- `options`: computed atom options.
- Returns a computed atom with the merged value `TResult`.

## Usage Examples

```ts
import { atom, mergeAtoms } from '@nrgyjs/core';

const price = atom(10);
const quantity = atom(3);

const total = mergeAtoms([price, quantity], (p, q) => p * q);

console.log(total()); // 30
```
