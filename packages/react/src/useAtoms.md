# `useAtoms.ts`

## Purpose

This module provides the `useAtoms()` hook, which reads multiple atoms as a
single object and returns their unwrapped values.

## Overview

`useAtoms()` is useful for components and views that depend on several pieces
of reactive state at once, for example `viewModel.state`. Instead of calling
`useAtom()` separately for each field, the hook accepts an object of atoms and
returns an object of values with the same shape.

## Conceptual Architecture

Internally, the module:

1. Normalizes `undefined` to an empty object.
2. Builds a computed atom with `compute()` that reads each property from the
   supplied atom map.
3. Uses `objectEquals` as the equality strategy so unchanged object shapes do
   not produce unnecessary updates.
4. Delegates subscription and cleanup to `useAtom()`.

This approach keeps reactive composition centralized while reducing manual
boilerplate in React components.

## Public API Description

### `useAtoms(): Record<string, never>`

- Returns an empty object when called without arguments.

### `useAtoms<TSourceAtoms>(sources: TSourceAtoms): TResult`

- `sources`: object whose properties are `Atom<unknown>` values.
- Returns an object with the same keys, but with atom values unwrapped.
- Re-renders the component when any observed atom value changes.

## Usage Examples

```tsx
import React from 'react';
import { atom } from '@nrgyjs/core';
import { useAtoms } from '@nrgyjs/react';

const firstName = atom('Ada');
const lastName = atom('Lovelace');

export function UserCard() {
  const { firstName: first, lastName: last } = useAtoms({
    firstName,
    lastName,
  });

  return <span>{first} {last}</span>;
}
```

