# `useAtom.ts`

## Purpose

This module provides the `useAtom()` React hook, which subscribes a component
to a single reactive `Atom<T>` value.

## Overview

`useAtom()` solves the basic task of reading an Nrgy atom from React. The hook
uses the atom's current value as initial component state and then synchronizes
React with subsequent changes through `effect()`.

## Conceptual Architecture

The hook has two main stages:

1. `useState(source)` captures the atom's current value as local component
   state.
2. `useEffect()` creates a subscription through `effect(source, callback)` and
   calls `subscription.destroy` during cleanup.

This guarantees correct subscription lifecycle management and prevents updates
after the component has unmounted.

## Public API Description

### `useAtom<T>(source: Atom<T>): T`

- `source`: atom or computed atom whose value should be observed.
- Returns the current value of the atom as type `T`.
- Re-renders the component when `source` changes.

## Usage Examples

```tsx
import React from 'react';
import { atom } from '@nrgyjs/core';
import { useAtom } from '@nrgyjs/react';

const counter = atom(0);

export function CounterValue() {
  const value = useAtom(counter);

  return <span>{value}</span>;
}
```

