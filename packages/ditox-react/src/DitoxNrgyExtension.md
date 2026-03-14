# `DitoxNrgyExtension.tsx`

## Purpose

This module provides `DitoxNrgyExtension`, a component that connects a
`ditox-react` container to Nrgy controller and view-model creation inside a
React tree.

## Overview

The component is intended for applications where controllers or view models use
`@nrgyjs/ditox` extensions such as `withContainer()` or `withInjections()`. It
removes the need to pass `provideDependencyContainer()` manually at every
controller creation site.

## Conceptual Architecture

The implementation acts as a bridge between three packages:

1. `useDependencyContainer()` reads the active container from `ditox-react`.
2. `provideDependencyContainer(container)` stores the container in Nrgy
   extension params.
3. `NrgyControllerExtension` publishes the provider through React context, and
   `useController()` from `@nrgyjs/react` consumes it during controller
   creation.

The helper `DitoxInjectionParamsProvider` runs during controller construction
and guarantees that the DI container is taken from the current React
environment.

## Public API Description

### `DitoxNrgyExtension: FC<PropsWithChildren>`

- `children`: React subtree whose controllers and view models should receive a
  `ditox` container automatically.
- Returns `NrgyControllerExtension` configured with the bridge provider between
  `ditox-react` and Nrgy.

## Usage Examples

```tsx
import React from 'react';
import { DitoxNrgyExtension } from '@nrgyjs/ditox-react';
import { CustomDependencyContainer } from 'ditox-react';

export function Root() {
  return (
    <CustomDependencyContainer container={container}>
      <DitoxNrgyExtension>
        <App />
      </DitoxNrgyExtension>
    </CustomDependencyContainer>
  );
}
```

