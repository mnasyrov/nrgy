# query.ts

## Назначение файла (Purpose)

Интеграция Nrgy.js с объектами `Query` из библиотеки `rx-effects`.

## Общая информация (Overview)

Этот файл предоставляет механизмы для взаимного преобразования между `Atom` из
Nrgy и `Query` из `rx-effects`. Это позволяет использовать атомы там, где
ожидаются объекты `Query`, и наоборот.

## Концептуальная архитектура (Conceptual Architecture)

`Query` — это объект с методом `get()` и свойством `value$` (Observable).

- `toQuery`: оборачивает `Atom`, используя его вызов для `get()` и
  `observe(source)` из `@nrgyjs/rxjs` для получения `value$`.
- `fromQuery`: подписывается на `value$` и хранит состояние во внутреннем атоме.
  Итоговый атом является вычисляемым (`compute`), который возвращает значение
  или выбрасывает ошибку в зависимости от состояния подписки.

## Описание публичного API (Public API Description)

### `toQuery<T>(source: Atom<T>): Query<T>`

Превращает Nrgy Atom в `Query`.

- `source`: Исходный Nrgy Atom.

### `fromQuery<T>(query: Query<T>): DestroyableAtom<T>`

Превращает `Query` в Nrgy Atom.

- `query`: Исходный объект `Query`.

## Примеры использования (Usage Examples)

```typescript
import { atom } from '@nrgyjs/core';
import { toQuery, fromQuery } from '@nrgyjs/rx-effects';

const count = atom(10);
const countQuery = toQuery(count);

console.log(countQuery.get()); // 10
countQuery.value$.subscribe(v => console.log(v));
```

---

Translation: [EN](./query.md) | RU
