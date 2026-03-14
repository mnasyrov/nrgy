# @nrgyjs/rxjs Package

## Package Purpose

Integration of Nrgy.js with the RxJS library for working with reactive data
streams.

## General Information

The `@nrgyjs/rxjs` package provides a bridge between Nrgy atoms and RxJS
Observables. This allows you to use powerful RxJS operators for processing data
stored in atoms, and vice versa — to translate data from external streams into
reactive atoms.

## Package Installation

```bash
npm install @nrgyjs/core @nrgyjs/rxjs rxjs
```

## Conceptual Architecture

The package architecture is built on two opposing transformations:

1. **Atom -> Observable**: A reaction to atom changes generates events in an
   RxJS stream.
2. **Observable -> Atom**: A subscription to an RxJS stream updates the atom's
   value.

## Functionality Documentation

### Transformations

- [**observe(atom, options?)**](./src/observe.md): Creates an `Observable` that
  emits the current value of the atom and all subsequent changes.
- [**fromObservable(observable, initialValue?)**](./src/fromObservable.md):
  Creates an `Atom` that subscribes to the `observable` and updates its value.

## Usage Examples

```typescript
import { atom } from '@nrgyjs/core';
import { observe, fromObservable } from '@nrgyjs/rxjs';
import { filter, interval } from 'rxjs';

// 1. Atom to Observable with filtering
const count = atom(0);
const evenCount$ = observe(count).pipe(filter(v => v % 2 === 0));

// 2. Observable to Atom
const time = fromObservable(interval(1000), 0);

count.set(1); // evenCount$ will ignore
count.set(2); // evenCount$ will emit 2
```

---

Translation: EN | [RU](./README.ru.md)
