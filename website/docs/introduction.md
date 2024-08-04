---
sidebar_position: 1
---

# Introduction

The library provides components for programming with reactive state and effects
using MVC/MVVM design patterns.

Core components form an efficient computation graph which includes:

- **Atom** - a state store
- **Signal** - an event emitter
- **Effect** - a subscription to Atom or Signal
- **Scope** - a sink of subscriptions

The library provides building blocks for MVC/MVVM design pattern to program
Controllers as business logic and View Models as a presentation layer
independently of UI framework. Controllers and view models can be extended to
use additional features, as example, to use a dependency injection container.

Supported optional integrations with third-party tools and frameworks:

- [React](https://react.dev) - a library for creating web user interfaces
- [Ditox.js](https://github.com/mnasyrov/ditox) - a dependency injection
  container and modules
- [RxJS](https://github.com/ReactiveX/rxjs) - a reactive programming library for
  composing asynchronous or callback-based code
- [RxEffects](https://github.com/mnasyrov/rx-effects) - the predecessor of
  Nrgy.js, a reactive state and effect management library based on RxJS

The core and MVC/MVVM components are framework-agnostic and can be used by web
and server applications, libraries and CLI tools.
