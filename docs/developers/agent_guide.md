# Agent Guide

## Purpose

This guide explains how automated contributors and AI agents should operate in
the Nrgy.js repository.

## Core Rules

- Read [Documentation Requirements](./docs_requirements.md) before generating or
  editing documentation.
- Use [Documentation Prompt](./docs_prompt.md) when the task is specifically
  about source-code documentation generation.
- Keep English `.md` and Russian `.ru.md` documentation synchronized.
- Do not create standalone documentation for `index.ts`.

## Source Change Expectations

- Prefer small, targeted changes over broad rewrites.
- Preserve the current package structure and public package names.
- Update tests and docs together with public API changes.
- Respect existing code style, naming, and formatting.

## Documentation Change Expectations

- Package-level summaries belong in package `README.md`.
- Module-level articles must include purpose, overview, conceptual
  architecture, public API, and usage examples.
- Examples should reflect the current code, not legacy APIs.

## Validation

- Use project commands such as `npm run check`, `npm run test`, and
  `npm run build` when the change requires validation.
- If validation is not run, state that explicitly in the final report.
