# `NrgyControllerExtension.tsx`

## Purpose

This module provides a React context for passing `ExtensionParamsProvider`
functions down the component tree and attaching them to created controllers.

## Overview

`NrgyControllerExtension` is used when controllers need additional parameters
from the React environment. This is useful for integrating dependency
injection, application-level context, or other `@nrgyjs/core` extensions into
controller creation.

## Conceptual Architecture

The module exposes two public elements:

1. `useNrgyControllerExtensionContext()` reads the accumulated list of
   `ExtensionParamsProvider` functions from context.
2. `NrgyControllerExtension` takes the parent provider list, appends the
   current `provider`, and publishes the resulting list to its children.

The provider list is fixed through `useState()`, which keeps the provider order
stable for descendants after the initial render.

## Public API Description

### `useNrgyControllerExtensionContext(): ReadonlyArray<ExtensionParamsProvider>`

- Returns the list of providers registered in the current React subtree.
- Used by `useController()` during controller construction.

### `NrgyControllerExtension(props)`

- `provider`: function of type `ExtensionParamsProvider` that extends
  controller parameters.
- `children`: descendant React elements that should receive this provider.
- Returns a React context provider with the updated provider list.

## Usage Examples

```tsx
import React from 'react';
import { NrgyControllerExtension } from '@nrgyjs/react';

const addTenant = (params: Record<string, unknown>) => ({
  ...params,
  tenantId: 'tenant-1',
});

export function App() {
  return (
    <NrgyControllerExtension provider={addTenant}>
      <FeatureRoot />
    </NrgyControllerExtension>
  );
}
```
