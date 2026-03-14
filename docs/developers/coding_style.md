# Coding Style

## Purpose

This guide captures the coding conventions that are consistently used across
the Nrgy.js codebase.

## Overview

The repository is a strict TypeScript monorepo with small focused modules,
colocated tests, and explicit runtime contracts. The style is intentionally
conservative: simple functions, explicit types where they matter, and minimal
abstraction layers.

## Language and Typing

- Use TypeScript in `strict` mode.
- Prefer named exports for public APIs.
- Keep generic types close to the exported contract and avoid unnecessary type
  indirection.
- Use overloads when the runtime API has clearly distinct call signatures.
- Prefer explicit public types for reusable contracts such as context objects,
  atoms, and options.

## Module Structure

- Keep modules focused on one primary responsibility.
- Place module documentation next to the source file.
- Do not create standalone documentation for `index.ts`; use package-level
  `README.md`.
- Keep tests next to implementation files using `*.test.ts` or `*.test.tsx`.

## Runtime Style

- Prefer small pure helpers over large mutable classes unless lifecycle state is
  the primary concern.
- Use comments sparingly and only where the implementation would otherwise be
  difficult to infer.
- Favor predictable cleanup through `destroy()`, `unsubscribe()`, and `Scope`.
- Preserve framework-agnostic boundaries in `@nrgyjs/core`.

## Formatting

- Follow `.editorconfig` and the current formatting configuration.
- Use two-space indentation.
- Keep semicolons and trailing commas.
- Prefer single quotes in TypeScript.
- Wrap Markdown prose at readable line lengths.

## Testing

- Use Vitest for unit tests.
- Name tests around observable behavior rather than implementation details.
- Cover lifecycle boundaries, destruction, and error propagation where
  relevant.

## Documentation

- Maintain English `.md` and Russian `.ru.md` variants for source docs.
- Keep README links aligned with the actual file layout.
- Ensure examples compile conceptually against the current public API.

---

Translation: EN | [RU](./coding_style.ru.md)
