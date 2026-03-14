# observe.ts

## Назначение файла

Преобразование `Atom` Nrgy в RxJS `Observable`.

## Общая информация

`observe` — это обратная функция для `fromObservable`. Она позволяет реагировать на изменения атома, используя мощные операторы RxJS. Она представляет значение `Atom` как RxJS `Observable`. Значение атома передается подписчикам `Observable` с помощью `effect`.

## Концептуальная архитектура

При подписке на возвращаемый `Observable` создается `effect` для исходного атома. Каждое изменение атома вызывает `subscriber.next(value)`. Ошибки атома также транслируются в `Observable`.

По умолчанию используется `shareReplay()`, чтобы новые подписчики получали текущее значение атома немедленно. Если включена опция `onlyChanges`, вместо этого используется `share()`, а начальное значение пропускается.

Внутренний `effect` управляется в рамках `Scope`, который привязан к жизненному циклу подписки `Observable`, а также отслеживает уничтожение исходного атома.

## Описание публичного API

### `observe<T>(source: Atom<T>, options?: ObserveOptions): Observable<T>`

Возвращает `Observable<T>`, транслирующий значения из `source`.

### `ObserveOptions`

- `sync`: выполнение эффекта синхронно (`false` по умолчанию).
- `onlyChanges`: если `true`, то `Observable` пропустит текущее значение и будет выдавать только последующие изменения (`false` по умолчанию).

## Примеры использования

### Базовое использование

```typescript
import { atom } from '@nrgyjs/core';
import { observe } from '@nrgyjs/rxjs';
import { map } from 'rxjs';

const count = atom(1);
const count$ = observe(count).pipe(map((c) => c * 10));

count$.subscribe((v) => console.log(v)); // 10
count.set(2); // 20
```

### Использование onlyChanges

```typescript
import { atom } from '@nrgyjs/core';
import { observe } from '@nrgyjs/rxjs';

const count = atom(1);
const count$ = observe(count, { onlyChanges: true });

count$.subscribe((v) => console.log(v)); // (ничего сразу)
count.set(2); // 2
```

