# `withView.ts`

## Purpose

This module implements the `withView()` extension and the `provideView()`
provider used to pass a `ViewBinding` into controller creation.

## Overview

The file connects the controller runtime to the UI layer. It defines
`ViewControllerContext`, can infer view props from controller context, and
ensures that a view binding is actually present in extension params.

## Conceptual Architecture

The module is built around the extension mechanism from `controller.ts`:

1. `withView<TProps>()` returns an `ExtensionFn` that extracts `ViewBinding`
   through the service key `NRGY_EXTENSION_VIEW_KEY`.
2. If the view is missing, `ControllerConstructorError` is thrown.
3. `provideView(view)` packages the view object into an
   `ExtensionParamsProvider`.
4. The types `ViewControllerContext<TProps>` and
   `InferViewPropsFromControllerContext<TContext, ElseType>` form a type-safe
   bridge between a controller and its view props.

## Public API Description

### `NRGY_EXTENSION_VIEW_KEY`

- Service key used to store `ViewBinding` inside extension params.

### `ViewControllerContext<TProps>`

- Controller context extended with the `view` field.

### `InferViewPropsFromControllerContext<TContext, ElseType>`

- Extracts the view prop type from a controller context.

### `withView<TProps>(): ExtensionFn<BaseControllerContext, ViewControllerContext<TProps>>`

- Returns an extension that adds `view` to the controller context.

### `provideView(view): ExtensionParamsProvider`

- Wraps a `ViewBinding` into a provider for controller creation.

## Usage Examples

```ts
import { declareController, provideView, withView, createViewProxy } from '@nrgyjs/core';

const GreetingController = declareController()
  .extend(withView<{ name: string }>())
  .apply(({ view }) => ({
    greet: () => `Hello, ${view.props.name()}!`,
  }));

const view = createViewProxy({ name: 'Ada' });
const controller = new GreetingController([provideView(view)]);
```

