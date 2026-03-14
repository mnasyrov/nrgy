# `atomSubject.ts`

## Назначение файла

Модуль предоставляет `AtomSubject` и функцию `createAtomSubject()`, объединяя
поведение атома с возможностью вручную эмитить значения и ошибки.

## Общая информация

`AtomSubject` полезен в интеграционных слоях, где внешний источник событий
должен быть представлен как Nrgy-атом. В отличие от обычного `SourceAtom`,
этот тип умеет переключаться между состоянием значения и состоянием ошибки.

## Концептуальная архитектура

Реализация строится из двух слоев:

1. Внутренний source-атом хранит `State<T>`, где явно кодируется тип состояния:
   значение или ошибка.
2. Внешний результат создается через `compute()`, который либо возвращает
   значение, либо выбрасывает сохраненную ошибку.

Поверх вычисляемого атома навешиваются методы `destroy()`, `next()` и
`error()`, формируя API `AtomSubject<T>`.

## Описание публичного API

### `type AtomSubject<T>`

- Расширяет `DestroyableAtom<T>`.
- Добавляет методы `next(value)` и `error(error)`.

### `createAtomSubject<T>(initialValue, options?): AtomSubject<T>`

- `initialValue`: стартовое значение subject-а.
- `options`: стандартные опции атома.
- Возвращает атом, который умеет эмитить значения и ошибки вручную.

## Примеры использования

```ts
import { createAtomSubject, effect } from '@nrgyjs/core';

const subject = createAtomSubject(0);

const subscription = effect(subject, (value) => {
  console.log(value);
});

subject.next(1);
subject.error(new Error('boom'));
subscription.destroy();
subject.destroy();
```
