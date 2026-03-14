# Package @nrgyjs/ditox

## Package Purpose

The `@nrgyjs/ditox` package integrates Nrgy.js controller declarations with the
`ditox` dependency injection container.

## Overview

The package adds extensions that make a `ditox` container available inside
controllers and view models. It also provides a helper for adapting injected
controllers to DI bindings.

## Package Installation

```bash
npm install @nrgyjs/core @nrgyjs/ditox ditox
```

```bash
yarn add @nrgyjs/core @nrgyjs/ditox ditox
```

```bash
pnpm add @nrgyjs/core @nrgyjs/ditox ditox
```

## Conceptual Architecture

The package is intentionally small and built around the controller extension
mechanism from `@nrgyjs/core`.

1. `withContainer()` injects the active `ditox` container into controller
   context.
2. `withInjections()` resolves a token map from that container and exposes the
   resulting `deps` object in controller context.
3. `applyInjections()` adapts an injected controller declaration to a function
   that can be used in DI configuration.

## Feature Documentation

- [applyInjections](./src/applyInjections.md): Adapter from controller
  declaration to container-aware factory.
- [withContainer](./src/withContainer.md): Extension for providing a `ditox`
  container.
- [withInjections](./src/withInjections.md): Extension for resolving tokens
  into `deps`.

## Usage Examples

```ts
import { declareController } from '@nrgyjs/core';
import { withInjections } from '@nrgyjs/ditox';
import { token } from 'ditox';

const LOGGER = token<(message: string) => void>();

const LoggerController = declareController()
  .extend(withInjections({ log: LOGGER }))
  .apply(({ deps }) => ({
    write: (message: string) => deps.log(message),
  }));
```
