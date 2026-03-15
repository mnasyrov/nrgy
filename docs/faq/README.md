# FAQ

## How is Nrgy.js different from a typical state manager?

Nrgy.js is not only about storing and updating state. It combines fine-grained
reactivity with explicit lifecycle ownership, controllers, and view models.

The main difference is that it is designed to keep business logic, state,
cleanup, and UI contracts separate instead of treating state management as an
isolated concern.

## Why does `effect()` not run immediately?

By default, `effect()` is deferred. This allows several synchronous state
updates to settle first, so the effect can observe the final consistent state
instead of intermediate values.

If you need synchronous observation, use `syncEffect()`, but only when the
ordering really matters.

## When should I use `batch()`?

Use `batch()` when several writes form one logical transition and observers
should only see the final consistent state.

Typical cases:

- updating several form fields together
- applying server data to several atoms at once
- preventing observers from reacting to intermediate states

## Why do I need `scope`?

`Scope` is the ownership boundary for reactive resources.

Use it to collect:

- effects and subscriptions
- child scopes
- atoms created for a feature
- custom cleanup callbacks

When the owner is destroyed, `scope` lets you release everything in one place.

## When should I call `destroy()`?

Call `destroy()` when the feature that owns the resource is finished.

Typical cases:

- a screen is unmounted
- a temporary flow ends
- a long-lived controller or view model is no longer needed

If a controller, scope, or atom can outlive its usefulness and still stay
reachable, it should have an explicit destruction point.

## How is MVVM different from MVC here?

In this documentation, the useful difference is practical:

- MVC keeps more explicit coordination and binding logic in the controller
- MVVM emphasizes a cleaner view-facing contract through a view model

Both separate business logic from rendering, but MVVM is the more useful mental
model for UI-facing contracts in Nrgy.js.

## How should I pass dependencies?

Use params for explicit feature inputs. Use extensions or DI for
infrastructure-level dependencies.

Examples of params:

- initial values
- screen identifiers
- feature configuration

Examples of DI:

- API clients
- loggers
- gateways
- analytics services

## Can I use Nrgy.js without React?

Yes. The core primitives, controllers, view models, scopes, and DI integrations
do not require React.

React is only one UI integration layer. The same business logic can be used in
headless flows, SDK-like integrations, tests, or other UI environments.
