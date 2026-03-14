# `readonlyAtom.ts`

## Purpose

This module provides `readonlyAtom()`, which creates a read-only view of an
existing atom.

## Overview

`readonlyAtom()` is intended for safe state exposure. It hides the mutation
methods of a `SourceAtom` while preserving reactivity and the label of the
original atom.

## Conceptual Architecture

The function reads the label through `getAtomLabel()` and creates
`compute(source, { label })`. As a result:

- the current source value is preserved;
- updates remain reactive automatically;
- callers only receive the `Atom<T>` interface without write methods.

## Public API Description

### `readonlyAtom<T>(source: Atom<T>): Atom<T>`

- `source`: original atom.
- Returns a read-only atom that reflects `source`.

## Usage Examples

```ts
import { atom, readonlyAtom } from '@nrgyjs/core';

const source = atom(1);
const exposed = readonlyAtom(source);

console.log(exposed()); // 1
source.set(2);
console.log(exposed()); // 2
```
