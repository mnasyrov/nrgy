# `withContainer.ts`

## Purpose

This module implements the `withContainer()` extension and the
`provideDependencyContainer()` provider, which pass a `ditox` container into
controller context.

## Overview

This module is the foundation of the package's DI integration. If no container
is provided, the extension fails controller creation with a
`ControllerConstructorError`.

## Conceptual Architecture

The module uses the extension mechanism from `@nrgyjs/core`:

1. `DITOX_EXTENSION_CONTAINER_KEY` defines the internal key in extension
   params.
2. `withContainer()` extracts the `Container` under that key and adds it to the
   resulting context.
3. `provideDependencyContainer(container)` creates a provider that writes the
   container into extension params during controller construction.

## Public API Description

### `DITOX_EXTENSION_CONTAINER_KEY`

- Service string key for storing the container in extension params.

### `DependencyContainerContext`

- Controller context extended with `container: Container`.

### `withContainer<TSourceContext>(): ExtensionFn<...>`

- Returns an extension that augments context with `container`.
- Throws `ControllerConstructorError` if the container is missing.

### `provideDependencyContainer(container): ExtensionParamsProvider`

- Wraps a container into a provider for controller creation.

## Usage Examples

```ts
import { declareController } from '@nrgyjs/core';
import { createContainer } from 'ditox';
import { provideDependencyContainer, withContainer } from '@nrgyjs/ditox';

const Controller = declareController()
  .extend(withContainer())
  .apply(({ container }) => ({
    hasContainer: () => Boolean(container),
  }));

const container = createContainer();
const controller = new Controller([provideDependencyContainer(container)]);
```

---

Translation: EN | [RU](./withContainer.ru.md)
