---
layout: home

hero:
  name: Nrgy.js
  text: Reactive business logic outside the UI
  tagline: Build UI-independent state, effects, controllers, and view models on top of a small reactive core.
  image:
    src: /assets/logo.svg
    alt: Nrgy.js logo
  actions:
    - theme: brand
      text: Quick start
      link: /content/docs/quick-start
    - theme: alt
      text: Read the Architecture
      link: /content/docs/architecture/README

features:
  - title: UI-independent logic
    details: Keep business rules outside React components and reuse them across multiple views.
  - title: Reactive core
    details: Model state with atoms, computed values, effects, scopes, and explicit lifecycle control.
  - title: Controller and ViewModel patterns
    details: Expose a clean presentation contract to the UI while keeping orchestration and dependencies out of components.
---

## Start from the right path

Nrgy.js combines a small reactive core with architecture patterns for
controllers, view models, lifecycle, and dependency-aware application logic.

- Core primitives
- MVVM patterns
- React integration
- Migration guides
- Recipes

## Reading paths

Pick the route that matches your current task instead of guessing where to
start.

### New to Nrgy.js

Introduction -> Quick Start -> Core -> MVVM and Controllers

### Designing an app architecture

Architecture -> MVVM -> Integrations -> Recipes

### Migrating from older versions

Migration -> Core -> Recipes

## What you can build

The docs focus on practical application structure, not only isolated API calls.

### Screen view models

Keep screen state, actions, and loading flows out of the render layer.

### Shared business controllers

Reuse one business flow across multiple views and screens.

### Forms with batched updates

Model several fields and coordinated updates without leaking logic into UI.

### React + Ditox integration

Wire view models and shared services through explicit dependency boundaries.

## Documentation sections

Use the product docs as the main path, then drop into contributing and package
references when you need implementation detail.

- [Introduction](/content/docs/introduction): what Nrgy.js is, what it solves, and how to read the docs
- [Core](/content/docs/core/README): atoms, computed values, effects, batching, scopes, lifecycle, and scheduler behavior
- [Architecture](/content/docs/architecture/README): layering, UI boundaries, reuse strategy, and contracts between layers
- [MVVM and Controllers](/content/docs/mvvm/README): controller and view-model roles, public contracts, and lifecycle expectations
- [Integrations](/content/docs/integrations/README): React bindings, Ditox-based dependency injection, and advanced integrations
- [Recipes](/content/docs/recipes/README): concrete examples for view models, shared state, forms, cleanup, and DI
- [Migration](/content/docs/migration/README): legacy concepts, replacement patterns, and import-level migration guidance
- [FAQ](/content/docs/faq/README): short answers about effects, batch, scope, destroy, MVVM, and React usage
- [Contributing](/content/docs/contributing/README): workflow, coding style, documentation rules, and agent-facing repository conventions
