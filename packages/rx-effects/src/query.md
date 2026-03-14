# query.ts

## Purpose

Integration of Nrgy.js with `Query` objects from the `rx-effects` library.

## Overview

This file provides mechanisms for mutual conversion between `Atom` from Nrgy and
`Query` from `rx-effects`. This allows atoms to be used where `Query` objects
are expected, and vice versa.

## Conceptual Architecture

`Query` is an object with a `get()` method and a `value$` property (Observable).

- `toQuery`: wraps an `Atom`, using its call for `get()` and `observe(source)`
  for `value$`.
- `fromQuery`: subscribes to `value$` and stores the state in an internal atom.
  The resulting atom is a computed atom (`compute`), which returns a value or
  throws an error depending on the subscription state.

## Public API Description

### `toQuery<T>(source: Atom<T>): Query<T>`

Converts an Nrgy Atom into a `Query`.

- `source`: The source Nrgy Atom.

### `fromQuery<T>(query: Query<T>): DestroyableAtom<T>`

Converts a `Query` into an Nrgy Atom.

- `query`: The source `Query` object.

## Usage Examples

```typescript
import { atom } from '@nrgyjs/core';
import { toQuery, fromQuery } from '@nrgyjs/rx-effects';

const count = atom(10);
const countQuery = toQuery(count);

console.log(countQuery.get()); // 10
countQuery.value$.subscribe(v => console.log(v));
```

