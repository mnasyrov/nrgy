# `controller.ts`

## Purpose

This module implements the declarative controller API of Nrgy.js: context
types, extensions, declaration builders, and the runtime controller
constructor.

## Overview

This file is the center of the MVC/MVVM layer in `@nrgyjs/core`. It defines:

- controller and service types;
- controller context with `scope` and parameters;
- the extension mechanism;
- both functional and class-based declaration styles.

Other MVC modules, including `withView()` and `declareViewModel()`, build on
top of these contracts.

## Conceptual Architecture

The module is organized into several parts:

1. Base types such as `Controller`, `ControllerDeclaration`,
   `BaseControllerContext`, and `ExtensionFn`.
2. `BaseController`, which creates `ControllerContext`, schedules
   `onCreated()` in a microtask, and destroys its `Scope` in `destroy()`.
3. `ControllerDeclarationBuilder`, which incrementally adds `params()` and
   `extend()`, then finalizes through `apply()` or `getBaseClass()`.
4. `createControllerContext()`, which assembles `scope`, parameters, extension
   params, and the helper `create()` method for nested controller creation.
5. Providers `provideControllerParams()` and `provideExtensionParams()`, which
   feed values into the extension mechanism.

This design supports both functional and class-based controllers with a shared
lifecycle model.

## Public API Description

### Core Types

- `BaseService`: base service type for controllers.
- `Controller<TService>`: service type with required `destroy()`.
- `ControllerParams`, `BaseControllerContext`,
  `ControllerParamsContext<T>`: parameter and context types.
- `ExtensionFn<TSourceContext, TContextExtension>`: function that extends a
  controller context.
- `ExtensionParamsProvider`: provider for additional extension parameters.
- `ControllerDeclaration<TContext, TService>`: controller constructor type.
- `ControllerContext<TContext>`: factory context with helper `create()`.
- `ControllerFactory<TContext, TService>`: functional controller factory.

### Classes and Errors

- `ControllerConstructorError`: error raised when controller creation fails.
- `BaseController<TContext>`: base class for class-based controllers.
- `ControllerDeclarationBuilder<TContext>`: builder for controller
  declarations.

### Functions

- `declareController(factory?)`: creates either a ready declaration or a
  builder.
- `provideControllerParams(params)`: wraps params into an
  `ExtensionParamsProvider`.
- `provideExtensionParams(params)`: adds arbitrary extension parameters.

## Usage Examples

```ts
import { declareController } from '@nrgyjs/core';

const CounterController = declareController()
  .params<{ initialValue: number }>()
  .apply(({ scope, params }) => {
    const count = scope.atom(params.initialValue);

    return {
      count,
      increase: () => count.update((prev) => prev + 1),
    };
  });

const controller = new CounterController({ initialValue: 5 });
```

```ts
import { BaseController, type ControllerParamsContext } from '@nrgyjs/core';

class LoggerController extends BaseController<
  ControllerParamsContext<{ prefix: string }>
> {
  log(message: string) {
    console.log(this.params.prefix, message);
  }
}
```

---

Translation: EN | [RU](./controller.ru.md)
