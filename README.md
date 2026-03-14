# Nrgy.js

<img alt="energy" src="energy.svg" width="120" />

Nrgy.js is a TypeScript-first toolkit for reactive state, effects, and
MVC/MVVM-style application architecture.

[![licence](https://img.shields.io/github/license/mnasyrov/nrgy.svg)](https://github.com/mnasyrov/nrgy/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/mnasyrov/nrgy/badge.svg?branch=main)](https://coveralls.io/github/mnasyrov/nrgy?branch=main)

## Project Description

Nrgy.js provides a set of small packages for building reactive applications
with explicit lifecycle management and optional integrations for React, RxJS,
`rx-effects`, and `ditox`.

## Project Overview

The project is organized around a few core ideas:

- atoms and computed atoms for reactive state;
- effects and schedulers for deterministic change propagation;
- scopes for ownership and cleanup of resources;
- controllers and view models for MVC/MVVM business logic;
- optional integration packages for React, `ditox`, RxJS, and `rx-effects`.

The packages are designed to work independently, so consumers can adopt only
the pieces they need.

## Main Features

- Reactive state with `atom()`, `compute()`, and `effect()`
- Explicit lifecycle management through `Scope`
- MVC/MVVM primitives for controllers and view models
- React integration through hooks and higher-order components
- RxJS and `rx-effects` interoperability
- Dependency injection integration with `ditox`
- Strict TypeScript-first API surface

## Changelog

- [Project Changelog](./CHANGELOG.md)

## Installation

Install only the packages you need:

| Package | Purpose | Install |
| --- | --- | --- |
| `@nrgyjs/core` | Reactive runtime, scope, MVC/MVVM primitives | `npm install @nrgyjs/core` |
| `@nrgyjs/react` | React bindings for atoms, controllers, and view models | `npm install @nrgyjs/core @nrgyjs/react react` |
| `@nrgyjs/ditox` | `ditox` dependency injection extensions | `npm install @nrgyjs/core @nrgyjs/ditox ditox` |
| `@nrgyjs/ditox-react` | React bridge for `ditox` + Nrgy controllers | `npm install @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react` |
| `@nrgyjs/rxjs` | RxJS interoperability | `npm install @nrgyjs/core @nrgyjs/rxjs rxjs` |
| `@nrgyjs/rx-effects` | `rx-effects` interoperability | `npm install @nrgyjs/core @nrgyjs/rxjs @nrgyjs/rx-effects rx-effects rxjs` |

## Documentation

- [Documentation Overview](./docs/README.md)
- [Developer and Agent Documentation](./docs/developers/README.md)

## Package List

- [@nrgyjs/core](./packages/core/README.md)
- [@nrgyjs/react](./packages/react/README.md)
- [@nrgyjs/ditox](./packages/ditox/README.md)
- [@nrgyjs/ditox-react](./packages/ditox-react/README.md)
- [@nrgyjs/rxjs](./packages/rxjs/README.md)
- [@nrgyjs/rx-effects](./packages/rx-effects/README.md)

