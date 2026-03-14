# Пакет @nrgyjs/rx-effects

## Назначение пакета

Интеграция Nrgy.js с библиотекой `rx-effects`.

## Общая информация

Пакет `@nrgyjs/rx-effects` предоставляет инструменты для взаимодействия между
атомами Nrgy и объектами `Query` из библиотеки `rx-effects`. Это позволяет
оборачивать атомы как запросы (`Query`) и наоборот, обеспечивая плавную
интеграцию между двумя реактивными системами.

## Установка пакета

```bash
npm install @nrgyjs/core @nrgyjs/rx-effects @nrgyjs/rxjs rx-effects rxjs
```

## Концептуальная архитектура

Пакет ориентирован на интерфейс `Query` из `rx-effects`, который состоит из
синхронного геттера (`get()`) и асинхронного потока изменений (`value$`).

1. **Атом в Query**: текущее значение атома доступно через `get()`, а его
   изменения передаются в `value$` с использованием интеграции `@nrgyjs/rxjs`.
2. **Query в Атом**: создается подписка на `value$` запроса, и последние
   значения или ошибки сохраняются во внутреннем атоме, который затем
   экспонируется как вычисляемый атом (`compute`).

## Документация по функционалу (Functional Documentation)

- [**toQuery(atom)**](./src/query.ru.md): Превращает Nrgy Atom в `rx-effects`
  Query.
- [**fromQuery(query)**](./src/query.ru.md): Превращает `rx-effects` Query в
  Nrgy Atom.

## Примеры использования (Usage Examples)

```typescript
import { atom } from '@nrgyjs/core';
import { toQuery, fromQuery } from '@nrgyjs/rx-effects';

// 1. Атом в Query
const count = atom(0);
const countQuery = toQuery(count);

console.log(countQuery.get()); // 0

// 2. Query в Атом
const anotherAtom = fromQuery(countQuery);
console.log(anotherAtom()); // 0
```

