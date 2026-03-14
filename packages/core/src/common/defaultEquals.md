# `defaultEquals.ts`

## Purpose

This module provides the `defaultEquals` equality function, which is used by
`@nrgyjs/core` as the default value comparison strategy.

## Overview

`defaultEquals` is used by `atom()` and `compute()` whenever the user does not
provide a custom `equal` function. It is the baseline rule for deciding whether
a new value should be treated as a change and whether observers should be
notified.

## Conceptual Architecture

The implementation is intentionally minimal and delegates comparison to
`Object.is`. This gives the runtime correct behavior for:

- primitive values;
- reference equality for objects;
- special cases such as `NaN` and `-0`.

The module is used as a shared low-level dependency in the reactive runtime and
in higher-level equality helpers such as `objectEquals`.

## Public API Description

### `defaultEquals: ValueEqualityFn<unknown>`

- Compares two values through `Object.is`.
- Returns `true` when the values should be treated as equal for reactive
  updates.

## Usage Examples

```ts
import { defaultEquals } from '@nrgyjs/core';

defaultEquals(1, 1); // true
defaultEquals(NaN, NaN); // true
defaultEquals({}, {}); // false
```
