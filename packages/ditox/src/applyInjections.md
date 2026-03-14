# `applyInjections.ts`

## Purpose

This module provides `applyInjections()`, which adapts a controller declaration
with dependencies into a factory function that accepts a `ditox` container.

## Overview

The utility is useful when registering controllers in a container or when
integrating them manually with DI configuration. It removes the need to create
an `ExtensionParamsProvider` by hand every time.

## Conceptual Architecture

`applyInjections()` is a thin wrapper:

1. It accepts a `ControllerDeclaration` whose context already expects `deps`.
2. It returns a function of the form `(container) => service`.
3. Internally, it creates the controller through `new controller([...providers])`
   and passes the provider created by `provideDependencyContainer(container)`.

## Public API Description

### `applyInjections<TContext, TService>(controller): (container: Container) => TService`

- `controller`: controller or view-model declaration that uses dependency
  injections.
- Returns a factory that accepts a `ditox` container and creates the service.

## Usage Examples

```ts
import { applyInjections, withInjections } from '@nrgyjs/ditox';
import { declareController } from '@nrgyjs/core';
import { createContainer, token } from 'ditox';

const LOGGER = token<(message: string) => void>();

const Controller = declareController()
  .extend(withInjections({ log: LOGGER }))
  .apply(({ deps }) => ({
    write: () => deps.log('hello'),
  }));

const factory = applyInjections(Controller);
const container = createContainer();
container.bindValue(LOGGER, (message) => {
  console.log(message);
});

const controller = factory(container);
controller.write();
controller.destroy();
```

