# fromObservable.ts

## Purpose

Convert an RxJS `Observable` into a reactive `Atom`.

## Overview

`fromObservable` is the counterpart to `observe`. It provides synchronous reactive access to values produced by an `Observable` by subscribing to it. The returned `Atom` always holds the most recent value emitted by the `Observable`. If the `Observable` emits an error, the `Atom` will throw that error when accessed.

The returned `Atom` is "destroyable", meaning it can be unsubscribed from the source `Observable` when it is no longer needed.

## Conceptual Architecture

Internally, `fromObservable` uses `createAtomSubject` from `@nrgyjs/core`. It subscribes to the source `Observable` and forwards all emitted values (`next`) and errors (`error`) to the internal `AtomSubject`. 

When the returned `Atom` is destroyed (e.g., via a `Scope`), it automatically unsubscribes from the source `Observable` to prevent memory leaks. This is handled via the `onDestroy` hook provided to `createAtomSubject`.

## Public API Description

### `fromObservable<T>(source: Observable<T> | Subscribable<T>): DestroyableAtom<T | undefined>`

Subscribes to the `source` and returns an `Atom` containing the latest value. Since no initial value is provided, the `Atom` starts with `undefined`.

- `source`: The RxJS `Observable` or `Subscribable` to subscribe to.

### `fromObservable<T>(source: Observable<T> | Subscribable<T>, initialValue: T): DestroyableAtom<T>`

Subscribes to the `source` and returns an `Atom` starting with `initialValue`.

- `source`: The RxJS `Observable` or `Subscribable` to subscribe to.
- `initialValue`: Initial value for the atom.

## Usage Examples

### Basic usage

```typescript
import { fromObservable } from '@nrgyjs/rxjs';
import { BehaviorSubject } from 'rxjs';

const subject = new BehaviorSubject(1);
const count = fromObservable(subject);

console.log(count()); // 1
subject.next(2);
console.log(count()); // 2
```

### With initial value

```typescript
import { fromObservable } from '@nrgyjs/rxjs';
import { Subject } from 'rxjs';

const subject = new Subject<number>();
const count = fromObservable(subject, 0);

console.log(count()); // 0
subject.next(10);
console.log(count()); // 10
```

### Managing lifecycle with Scope

```typescript
import { createScope } from '@nrgyjs/core';
import { fromObservable } from '@nrgyjs/rxjs';
import { interval } from 'rxjs';

const scope = createScope();
const timer = fromObservable(interval(1000), 0);

scope.add(timer);

// Later, when scope is destroyed, the subscription to interval is also closed.
scope.destroy();
```

