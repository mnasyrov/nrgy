# Package @nrgyjs/react

## Package Purpose

The `@nrgyjs/react` package adapts Nrgy.js primitives to React applications. It
provides hooks and higher-order components for binding atoms, controllers, and
view models to React component trees.

## Overview

The package focuses on two integration layers:

1. Reactive state binding through `useAtom()` and `useAtoms()`.
2. MVC/MVVM composition through `useController()`, `withViewController()`,
   `withViewModel()`, and `NrgyControllerExtension`.

This lets React components consume Nrgy state directly, while controller and
view model instances continue to be created and disposed by Nrgy.js rules.

## Package Installation

```bash
npm install @nrgyjs/core @nrgyjs/react react
```

```bash
yarn add @nrgyjs/core @nrgyjs/react react
```

```bash
pnpm add @nrgyjs/core @nrgyjs/react react
```

## Conceptual Architecture

The package is built around `@nrgyjs/core` declarations and React lifecycle.

1. `useAtom()` subscribes a component to a single `Atom<T>`.
2. `useAtoms()` combines an object of atoms into a single computed atom and
   keeps the resulting object stable with structural equality.
3. `useController()` creates a controller or view model instance once per
   declaration, connects it to a React-driven `ViewProxy`, updates view props,
   and disposes resources on unmount or declaration replacement.
4. `NrgyControllerExtension` stores React-side extension providers in context
   so nested components can augment controller creation.
5. `withViewController()` and `withViewModel()` wrap React components and inject
   controller/view-model instances into props.

## Functional Documentation

- [NrgyControllerExtension](./src/NrgyControllerExtension.md): React context
  for controller extension providers.
- [useAtom](./src/useAtom.md): Subscribe a component to one atom.
- [useAtoms](./src/useAtoms.md): Read multiple atoms as one object.
- [useController](./src/useController.md): Create and manage controllers or
  view models in React.
- [withViewController](./src/withViewController.md): Wrap a component with a
  controller.
- [withViewModel](./src/withViewModel.md): Wrap a component with a view
  model.

## Usage Examples

```tsx
import React from 'react';
import { declareController, readonlyAtom, withView } from '@nrgyjs/core';
import { useAtom, withViewController } from '@nrgyjs/react';

const CounterController = declareController()
  .extend(withView<{ initialValue: number }>())
  .apply(({ scope, view }) => {
    const value = scope.atom(view.props.initialValue());

    return {
      $value: readonlyAtom(value),
      increment: () => value.update((prev) => prev + 1),
    };
  });

const CounterView = withViewController(CounterController)(
  ({ controller, initialValue }) => {
    const value = useAtom(controller.$value);

    return (
      <button onClick={controller.increment}>
        Start: {initialValue}, current: {value}
      </button>
    );
  },
);
```

```tsx
import React from 'react';
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';
import { useAtoms, withViewModel } from '@nrgyjs/react';

const CounterViewModel = declareViewModel(({ scope, view }) => {
  const count = scope.atom(view.props.initialValue());

  return {
    state: { count: readonlyAtom(count) },
    increase: () => count.update((prev) => prev + 1),
  };
});

const Counter = withViewModel(CounterViewModel)(({ viewModel }) => {
  const { count } = useAtoms(viewModel.state);

  return <button onClick={viewModel.increase}>{count}</button>;
});
```

---

Translation: EN | [RU](./README.ru.md)
