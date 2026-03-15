# View Models

## Purpose

This page explains how to think about view models in Nrgy.js.

## View Model as Contract

A view model is a contract between business logic and presentation.

A good view model:

- exposes only the data the view needs
- exposes actions the view is allowed to trigger
- hides service orchestration and workflow details
- remains usable by different view implementations

## Example

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

export const CounterViewModel = declareViewModel(({ scope, view }) => {
  const count = scope.atom(view.props.initialValue());

  return {
    state: {
      count: readonlyAtom(count),
    },
    increment: () => count.update((value) => value + 1),
  };
});
```

## MVC vs MVVM

The useful distinction here is practical:

- MVC tends to keep explicit coordination and binding logic in the controller
- MVVM moves more of the view-facing connection into a model that the view can
  bind to
- both separate rendering from business logic, but MVVM emphasizes a cleaner
  public contract for the view

For Nrgy.js docs, the useful teaching angle is not historical purity. It is
showing how to keep views thin and business flows reusable.

## Documentation Recommendations

When documenting a view model, always state:

- which inputs it needs
- which state fields it exposes
- which actions it supports
- who owns its lifecycle

This makes migration to React wrappers and future docs-site pages much easier.

For React integration, `withViewModel()` is an important MVVM helper because it
makes the view-model boundary explicit at the component level.
