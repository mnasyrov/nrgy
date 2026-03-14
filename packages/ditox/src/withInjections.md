# `withInjections.ts`

## Purpose

This module implements the `withInjections()` extension, which resolves a set
of dependencies from a `ditox` container and exposes them in controller context
as `deps`.

## Overview

`withInjections()` is used on top of `withContainer()` or alongside a container
provider. The caller describes an object of tokens, and the extension returns a
value object with the same shape, available in the controller or view-model
factory.

## Conceptual Architecture

The module has three main parts:

1. Types `DependencyProps`, `DependencyTokenProps<Props>`, and
   `DependencyContext<Dependencies>`.
2. Extraction of the container from extension params through
   `DITOX_EXTENSION_CONTAINER_KEY`.
3. Resolution of all tokens through `resolveValues(container, tokens)` and
   exposure of the result in the `deps` field.

If the container is missing, the module throws `ControllerConstructorError`.

## Public API Description

### `DependencyProps`

- Base shape of a dependency object.

### `DependencyTokenProps<Props>`

- Maps a dependency shape into a `ditox` token shape.

### `DependencyContext<Dependencies>`

- Controller context extended with the `deps` field.

### `withInjections<TSourceContext, Dependencies>(tokens): ExtensionFn<...>`

- `tokens`: object of tokens to resolve from the container.
- Returns an extension that adds `deps` to controller context.

## Usage Examples

```ts
import { declareController } from '@nrgyjs/core';
import { token } from 'ditox';
import { withInjections } from '@nrgyjs/ditox';

const API_URL = token<string>();

const Controller = declareController()
  .extend(withInjections({ apiUrl: API_URL }))
  .apply(({ deps }) => ({
    getApiUrl: () => deps.apiUrl,
  }));
```

