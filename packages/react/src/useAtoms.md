# `useAtoms.ts`

## Purpose

This module provides the `useAtoms()` hook, which reads multiple atoms as a
single object and returns their unwrapped values.

## Overview

`useAtoms()` is useful for components and views that depend on several pieces
of reactive state at once, for example `viewModel.state`. Instead of calling
`useAtom()` separately for each field, the hook accepts an object of atoms and
returns an object of values with the same shape.

The object of atoms may be created inline on every render, for example
`useAtoms({ s1, s2 })`. The hook keeps the previous object while its keys and
atoms are the same, so the derived value stays referentially stable and the
subscription is not recreated.

## Conceptual Architecture

Internally, the module:

1. Normalizes `undefined` to an empty object.
2. Keeps the previous object of atoms while the next one has the same keys and
   the same atoms, compared with `objectEquals`.
3. Builds a computed atom with `compute()` that reads each property from the
   supplied atom map.
4. Uses `objectEquals` as the equality strategy so unchanged values do not
   produce a new result object.
5. Delegates subscription and cleanup to `useAtom()`, which is built on
   `useSyncExternalStore()` and delivers updates synchronously.

This approach keeps reactive composition centralized while reducing manual
boilerplate in React components.

## Public API Description

### `useAtoms(): Record<string, never>`

- Returns an empty object when called without arguments.

### `useAtoms<TSourceAtoms>(sources: TSourceAtoms): TResult`

- `sources`: object whose properties are `Atom<unknown>` values. The object
  may be created inline.
- Returns an object with the same keys, but with atom values unwrapped. The
  result keeps its identity while the values are the same.
- Re-renders the component once when any observed atom value changes, and
  renders values of a new set of sources in the same commit.

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
