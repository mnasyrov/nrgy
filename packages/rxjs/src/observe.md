# observe.ts

## Purpose

Convert an Nrgy `Atom` into an RxJS `Observable`.

## Overview

`observe` is the counterpart to `fromObservable`. It allows you to react to atom changes using powerful RxJS operators. It exposes the value of an `Atom` as an RxJS `Observable`. The atom's value will be propagated into the `Observable`'s subscribers using an `effect`.

## Conceptual Architecture

When subscribing to the returned `Observable`, an `effect` is created for the source atom. Each change in the atom triggers `subscriber.next(value)`. Atom errors are also broadcast to the `Observable`.

`shareReplay()` is used by default so that new subscribers immediately receive the latest current value of the atom. If `onlyChanges` option is enabled, `share()` is used instead, and the initial value is skipped.

The internal `effect` is managed within a `Scope` that is tied to the life of the `Observable` subscription and also monitors the destruction of the source atom.

## Public API Description

### `observe<T>(source: Atom<T>, options?: ObserveOptions): Observable<T>`

Returns an `Observable<T>` that broadcasts values from `source`.

### `ObserveOptions`

- `sync`: execute the effect synchronously (`false` by default).
- `onlyChanges`: if `true`, the `Observable` will skip the current value and only emit further changes (`false` by default).

## Usage Examples

### Basic usage

```typescript
import { atom } from '@nrgyjs/core';
import { observe } from '@nrgyjs/rxjs';
import { map } from 'rxjs';

const count = atom(1);
const count$ = observe(count).pipe(map((c) => c * 10));

count$.subscribe((v) => console.log(v)); // 10
count.set(2); // 20
```

### Using onlyChanges

```typescript
import { atom } from '@nrgyjs/core';
import { observe } from '@nrgyjs/rxjs';

const count = atom(1);
const count$ = observe(count, { onlyChanges: true });

count$.subscribe((v) => console.log(v)); // (nothing immediately)
count.set(2); // 2
```

