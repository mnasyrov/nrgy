# nrgy

<img alt="energy" src="energy.svg" width="120" />

The energy for reactive programming with MVC/MVVM patterns

[![npm](https://img.shields.io/npm/v/nrgy.svg)](https://www.npmjs.com/package/nrgy)
[![licence](https://img.shields.io/github/license/mnasyrov/nrgy.svg)](https://github.com/mnasyrov/nrgy/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/mnasyrov/nrgy/badge.svg?branch=main)](https://coveralls.io/github/mnasyrov/nrgy?branch=main)
[![types](https://img.shields.io/npm/types/nrgy.svg)](https://www.npmjs.com/package/nrgy)
[![downloads](https://img.shields.io/npm/dt/nrgy.svg)](https://www.npmjs.com/package/nrgy)

## Overview

The library provides components for programming with reactive state and effects
using MVC/MVVM design patterns.

Core components include Atoms (stores), Signals (event emitters), Scopes and
Effects (subscriptions), which form an efficient computation graph.

Additionally, the library includes an MVC/MVVM feature, that provides building
blocks for programming Controllers for a business layer and View Models for a
presentation layer. Controllers and view models can be extended using other
features in an optional way.

Other parts of the library include integrations with third-party tools and
frameworks. At the moment the following are supported:

- [React][link:react] - a library for creating web user interfaces
- [Ditox.js][link:ditox] - a dependency injection container and modules
- [RxJS][link:rxjs] - a reactive programming library for composing asynchronous
  or callback-based code
- [RxEffects][link:rx-effects] - the predecessor of Nrgy.js, a reactive state
  and effect management library based on RxJS

All of these integrations are optional and can be used independently.

The core and MVC components are framework-agnostic and can be used by web and
server applications, libraries and CLI tools.

[link:react]: https://react.dev
[link:ditox]: https://github.com/mnasyrov/ditox
[link:rxjs]: https://github.com/ReactiveX/rxjs
[link:rx-effects]: https://github.com/mnasyrov/rx-effects

## Main Features

- Reactive state and effects
- Fast and efficient computation graph
- Tools for MVC/MVVM patterns
- Framework-agnostic core components
- Developer-friendly functional API
- Typescript typings

## Installation

Nrgy is the all-in-one package with optional dependencies for particular
integrations.

```
npm install nrgy
```

Install additional dependencies according to the following table:

| Import             | Dependencies       | Command             |
| ------------------ | ------------------ | ------------------- |
| `nrgy`             | No dependencies    |                     |
| `nrgy/mvc`         | No dependencies    |                     |
| `nrgy/mvc-react`   | React.js           | `npm i react`       |
| `nrgy/react`       | React.js           | `npm i react`       |
| `nrgy/ditox`       | Ditox.js           | `npm i ditox`       |
| `nrgy/ditox-react` | Ditox.js, React.js | `npm i ditox react` |
| `nrgy/rx-effects`  | RxJS, RxEffects    | `npm i rx-effects`  |
| `nrgy/rxjs`        | RxJS               | `npm i rxjs`        |
| `nrgy/rxjs-react`  | RxJS, React.js     | `npm i rxjs react`  |

## Documentation

Find more docs at https://nrgy.js.org
