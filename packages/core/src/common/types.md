# `types.ts`

## Purpose

This module contains shared helper types used across different parts of
`@nrgyjs/core`.

## Overview

Although the file contains no runtime logic, it defines the baseline contracts
for generic objects, functions, and user-defined equality strategies. These
types are referenced by the reactive API and related utilities.

## Conceptual Architecture

The module is a thin layer of reusable TypeScript types:

- `AnyObject` is used where a loose dictionary shape is sufficient.
- `AnyFunction` is used in internal places that need a generic callable type.
- `ValueEqualityFn<T>` standardizes the signature of value comparison
  functions.

The file depends only on TypeScript and has no runtime dependencies.

## Public API Description

### `AnyObject`

- Alias for `Record<string, any>`.
- Used as a generic object dictionary type.

### `AnyFunction`

- Alias for `(...args: any[]) => any`.
- Used as a generic function type.

### `ValueEqualityFn<T>`

- Signature `(a: T, b: T) => boolean`.
- Defines the contract for comparing two values of the same type.

## Usage Examples

```ts
import type { ValueEqualityFn } from '@nrgyjs/core';

const compareNumbers: ValueEqualityFn<number> = (a, b) => a === b;
```
