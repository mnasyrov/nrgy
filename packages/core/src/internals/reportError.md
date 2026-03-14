# `reportError.ts`

## Purpose

This module provides `nrgyReportError`, a normalized error-reporting function
for host environments.

## Overview

Some runtime callbacks, such as deferred controller lifecycle hooks, should
surface unexpected errors without crashing internal cleanup logic. The module
uses `globalThis.reportError` when available and falls back to a no-op
otherwise.

## Conceptual Architecture

The implementation is intentionally small:

1. Detect whether `globalThis.reportError` exists and is callable.
2. Use the native function if available.
3. Otherwise expose a noop function.

This keeps host error reporting optional while preserving a uniform call site.

## Public API Description

### `nrgyReportError: (error: unknown) => void`

- Reports an unexpected error to the host environment when supported.
- Falls back to a no-op in environments without `reportError`.

## Usage Examples

```ts
import { nrgyReportError } from './reportError';

try {
  throw new Error('unexpected');
} catch (error) {
  nrgyReportError(error);
}
```

---

Translation: EN | [RU](./reportError.ru.md)
