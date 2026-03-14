# `atomSubject.ts`

## Purpose

This module provides `AtomSubject` and `createAtomSubject()`, combining atom
behavior with the ability to emit values and errors manually.

## Overview

`AtomSubject` is useful in integration layers where an external event source
needs to be represented as an Nrgy atom. Unlike a normal `SourceAtom`, it can
switch between a value state and an error state.

## Conceptual Architecture

The implementation is built from two layers:

1. An internal source atom stores `State<T>`, explicitly encoding either a
   value state or an error state.
2. The exported result is a computed atom that either returns the value or
   throws the stored error.

Methods `destroy()`, `next()`, and `error()` are attached on top of that
computed atom to form the `AtomSubject<T>` API.

## Public API Description

### `type AtomSubject<T>`

- Extends `DestroyableAtom<T>`.
- Adds `next(value)` and `error(error)`.

### `createAtomSubject<T>(initialValue, options?): AtomSubject<T>`

- `initialValue`: initial subject value.
- `options`: standard atom options.
- Returns an atom that can emit values and errors manually.

## Usage Examples

```ts
import { createAtomSubject, effect } from '@nrgyjs/core';

const subject = createAtomSubject(0);

const subscription = effect(subject, (value) => {
  console.log(value);
});

subject.next(1);
subject.error(new Error('boom'));
subscription.destroy();
subject.destroy();
```

---

Translation: EN | [RU](./atomSubject.ru.md)
