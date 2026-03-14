# Introduction

## Purpose

This page introduces Nrgy.js at the product level before the reader moves into
the API and architectural sections.

## What Nrgy.js Is

Nrgy.js is a library for separating business logic and state from UI, built on
a reactive core with controllers and MVVM/MVC patterns.

At a high level, Nrgy.js combines:

- a reactive core for state, derivations, and effects
- explicit lifecycle and cleanup through scopes and destroy points
- controllers and view models as feature-level logic boundaries
- thin and replaceable UI integrations

## What Problem It Solves

Nrgy.js helps solve a specific class of problems:

- keeping business logic independent from UI
- reusing the same feature logic across several views
- making lifecycle and cleanup explicit and controllable
- integrating feature logic with React and dependency injection

It is useful when an application starts to outgrow component-local state and ad
hoc side effects.

## Reading Path

If you are new to Nrgy.js, read the documentation in this order:

1. Read [Quick Start](./quick-start.md).
2. Continue with [Core](./core/README.md).
3. Then move to [MVVM and Controllers](./mvvm/README.md).
4. After that read [Architecture](./architecture/README.md) and
   [Integrations](./integrations/README.md).
5. Use [Recipes](./recipes/README.md), [Migration](./migration/README.md), and
   [FAQ](./faq/README.md) as needed.
