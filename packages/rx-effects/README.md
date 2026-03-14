# Package @nrgyjs/rx-effects

## Package Purpose

Integration of Nrgy.js with the `rx-effects` library.

## Overview

The `@nrgyjs/rx-effects` package provides tools for interoperability between
Nrgy atoms and `Query` objects from the `rx-effects` library. It allows you to
wrap atoms as queries and vice versa, enabling seamless integration between the
two reactive systems.

## Package Installation

```bash
npm install @nrgyjs/core @nrgyjs/rx-effects @nrgyjs/rxjs rx-effects rxjs
```

## Conceptual Architecture

The package focuses on the `Query` interface from `rx-effects`, which consists
of a synchronous getter (`get()`) and an asynchronous stream of changes (
`value$`).

1. **Atom to Query**: An atom's current value is exposed via `get()`, and its
   changes are piped into `value$` using the `@nrgyjs/rxjs` integration.
2. **Query to Atom**: A subscription is created for the query's `value$`, and
   the latest values or errors are stored in an internal atom, which is then
   exposed as a computed atom.

## Functional Documentation

- [**toQuery(atom)**](./src/query.md): Converts an Nrgy Atom into an
  `rx-effects` Query.
- [**fromQuery(query)**](./src/query.md): Converts an `rx-effects` Query into an
  Nrgy Atom.

## Usage Examples

```typescript
import { atom } from '@nrgyjs/core';
import { toQuery, fromQuery } from '@nrgyjs/rx-effects';

// 1. Atom to Query
const count = atom(0);
const countQuery = toQuery(count);

console.log(countQuery.get()); // 0

// 2. Query to Atom
const anotherAtom = fromQuery(countQuery);
console.log(anotherAtom()); // 0
```

---

Translation: EN | [RU](./README.ru.md)
