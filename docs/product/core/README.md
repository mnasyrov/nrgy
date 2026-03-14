# Core

## Purpose

This section explains the low-level primitives behind Nrgy.js.

## Overview

The value of Nrgy.js is not only reactivity by itself, but reactivity shaped
around lifecycle, batching, and controller-oriented business logic.

Core topics:

- writable atoms
- computed atoms
- effects
- scopes
- batching
- scheduling
- cleanup and destruction

## Pages

- [Atoms, Computed, and Effects](./atoms-computed-effects.md)
- [Lifecycle, Batch, and Scheduling](./lifecycle-batch-scheduling.md)

## What To Internalize

- Keep derived computations pure.
- Put side effects into `effect()` or controller actions.
- Treat cleanup as part of the design, not as an afterthought.
- Use `batch()` when multiple updates must be observed consistently.
