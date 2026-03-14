# Dependency Injection

## Purpose

This page explains the main dependency injection path for Nrgy.js through
`ditox` and the React bridge built on top of it.

## Main APIs

`@nrgyjs/ditox`:

- `withContainer()`
- `withInjections()`
- `applyInjections()`

`@nrgyjs/ditox-react`:

- `DitoxNrgyExtension`

This is the primary and recommended DI integration path for Nrgy.js.

## When To Use DI

Use DI for infrastructure dependencies such as:

- API clients
- loggers
- gateways
- analytics

Do not use DI as a substitute for explicit feature inputs. Params and DI solve
different problems.

## Injecting Dependencies into Controllers

`withInjections()` resolves values from the active container and exposes them
to controller logic through `deps`.

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

## Container Wiring

`withContainer()` is the lower-level extension that makes the active `ditox`
container available to controller creation.

Use it when:

- container access should be provided explicitly
- controller creation happens outside the standard React bridge
- custom extension composition is needed

`applyInjections()` adapts injected controller declarations into a container
friendly form and helps integrate them with DI configuration.

## React plus Ditox

If your application already uses `ditox` inside React, `DitoxNrgyExtension` is
the main bridge from React tree to controller creation.

```tsx
import React from 'react';
import { DitoxNrgyExtension } from '@nrgyjs/ditox-react';

export function App() {
  return (
    <DitoxNrgyExtension>
      <FeatureRoot />
    </DitoxNrgyExtension>
  );
}
```

This keeps React controller creation aligned with the active dependency
container without hardcoding DI into business logic.
