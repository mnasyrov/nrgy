# `flushMicrotasks.ts`

## Purpose

This module provides `flushMicrotasks()`, a tiny test helper for waiting until
the current microtask and timer turn has completed.

## Overview

The helper is used in tests that need to wait for deferred work scheduled by
the runtime, React, or browser-like environments. It offers a simple promise
API instead of exposing environment-specific scheduling details in each test.

## Conceptual Architecture

`flushMicrotasks()` returns a promise resolved via `setTimeout(resolve, 0)`.
This advances execution to the next macrotask turn, by which point queued
microtasks from the current turn have already run.

## Public API Description

### `flushMicrotasks(): Promise<void>`

- Returns a promise that resolves on the next timer turn.
- Intended for test synchronization rather than production logic.

## Usage Examples

```ts
import { flushMicrotasks } from './flushMicrotasks';

await flushMicrotasks();
```

---

Translation: EN | [RU](./flushMicrotasks.ru.md)
