# fromObservable.ts

## Назначение файла

Преобразование RxJS `Observable` в реактивный `Atom`.

## Общая информация

`fromObservable` — это обратная функция для `observe`. Она обеспечивает синхронный реактивный доступ к значениям, создаваемым `Observable`, путем подписки на него. Возвращаемый `Atom` всегда хранит самое последнее значение, испущенное `Observable`. Если `Observable` выдает ошибку, `Atom` выбросит эту ошибку при обращении к нему.

Возвращаемый `Atom` является «уничтожаемым» (`DestroyableAtom`), что означает возможность отписки от исходного `Observable`, когда он больше не нужен.

## Концептуальная архитектура

Внутри `fromObservable` использует `createAtomSubject` из `@nrgyjs/core`. Функция подписывается на исходный `Observable` и пересылает все испущенные значения (`next`) и ошибки (`error`) во внутренний `AtomSubject`.

Подписка на `Observable` автоматически завершается при уничтожении атома (например, через `Scope`). Это реализовано с помощью хука `onDestroy`, который передается в `createAtomSubject`.

## Описание публичного API

### `fromObservable<T>(source: Observable<T> | Subscribable<T>): DestroyableAtom<T | undefined>`

Подписывается на `source` и возвращает `Atom`, содержащий последнее значение. Поскольку начальное значение не указано, `Atom` инициализируется значением `undefined`.

- `source`: RxJS `Observable` или `Subscribable` для подписки.

### `fromObservable<T>(source: Observable<T> | Subscribable<T>, initialValue: T): DestroyableAtom<T>`

Подписывается на `source` и возвращает `Atom`, инициализированный значением `initialValue`.

- `source`: RxJS `Observable` или `Subscribable` для подписки.
- `initialValue`: Начальное значение для атома.

## Примеры использования

### Базовое использование

```typescript
import { fromObservable } from '@nrgyjs/rxjs';
import { BehaviorSubject } from 'rxjs';

const subject = new BehaviorSubject(1);
const count = fromObservable(subject);

console.log(count()); // 1
subject.next(2);
console.log(count()); // 2
```

### С начальным значением

```typescript
import { fromObservable } from '@nrgyjs/rxjs';
import { Subject } from 'rxjs';

const subject = new Subject<number>();
const count = fromObservable(subject, 0);

console.log(count()); // 0
subject.next(10);
console.log(count()); // 10
```

### Управление жизненным циклом через Scope

```typescript
import { createScope } from '@nrgyjs/core';
import { fromObservable } from '@nrgyjs/rxjs';
import { interval } from 'rxjs';

const scope = createScope();
const timer = fromObservable(interval(1000), 0);

// Добавляем атом в scope для автоматического уничтожения
scope.add(timer);

// Позже, при уничтожении scope, подписка на interval также будет закрыта.
scope.destroy();
```
