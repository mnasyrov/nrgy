# Integrations

## Purpose

This section shows how Nrgy.js connects to UI frameworks and external reactive
or DI systems.

## Main Integration Paths

- [React](./react.md): hooks, controller mounting, atom subscriptions, and
  higher-level React bindings.
- [Dependency Injection](./dependency-injection.md): `ditox`,
  `ditox-react`, container wiring, and injected controller dependencies.

## RxJS and rx-effects

Nrgy.js also integrates with external reactive stream libraries.

`@nrgyjs/rxjs`:

- `observe()`
- `fromObservable()`

`@nrgyjs/rx-effects`:

- `toQuery()`
- `fromQuery()`

`@nrgyjs/rxjs` remains useful when part of the system already relies on RxJS
streams, but the rest of the app wants atom-based state and controller
lifecycle.

`@nrgyjs/rx-effects` should now be treated as a legacy or advanced integration.
The `rx-effects` library is deprecated and no longer actively evolving, so this
path is becoming less relevant for most teams.

## Guidance

- start with [React](./react.md) if you are wiring UI components
- use [Dependency Injection](./dependency-injection.md) when infrastructure
  services should be resolved from a container
- treat Rx integrations as advanced or ecosystem-specific
- treat `rx-effects` as legacy-oriented unless you are maintaining existing code
