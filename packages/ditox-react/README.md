# Package @nrgyjs/ditox-react

## Package Purpose

The `@nrgyjs/ditox-react` package connects React-based Nrgy controllers and
view models to a `ditox-react` dependency container.

## Overview

The package provides a React extension component that reads the active
dependency container from `ditox-react` and passes it into Nrgy controller
creation through `@nrgyjs/react`.

## Package Installation

```bash
npm install @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react
```

```bash
yarn add @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react
```

```bash
pnpm add @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react
```

## Conceptual Architecture

The package is intentionally centered on a single component:

1. `useDependencyContainer()` reads the active DI container from React context.
2. `provideDependencyContainer()` converts that container into an Nrgy
   extension provider.
3. `NrgyControllerExtension` injects the provider into the subtree so
   `useController()` can create controllers and view models with DI support.

## Feature Documentation

- [DitoxNrgyExtension](./src/DitoxNrgyExtension.md): React bridge between
  `ditox-react` and Nrgy controller creation.

## Usage Examples

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
