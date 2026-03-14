# Пакет @nrgyjs/rxjs

## Назначение пакета

Интеграция Nrgy.js с библиотекой RxJS для работы с реактивными потоками данных.

## Общая информация

Пакет `@nrgyjs/rxjs` предоставляет мост между атомами Nrgy и потоками (
Observables) RxJS. Это позволяет использовать мощные операторы RxJS для
обработки данных, хранящихся в атомах, и наоборот — транслировать данные из
внешних потоков в реактивные атомы.

## Установка пакета

```bash
npm install @nrgyjs/core @nrgyjs/rxjs rxjs
```

## Концептуальная архитектура

Архитектура пакета строится на двух встречных преобразованиях:

1. **Atom -> Observable**: Реакция на изменения атома порождает события в потоке
   RxJS.
2. **Observable -> Atom**: Подписка на поток RxJS обновляет значение атома.

## Документация по функционалу

### Преобразования

- [**observe(atom, options?)**](./src/observe.ru.md): Создает `Observable`,
  который выдает текущее
  значение атома и все последующие изменения.
- [**fromObservable(observable, initialValue?)**](./src/fromObservable.ru.md):
  Создает `Atom`, который
  подписывается на `observable` и обновляет свое значение.

## Примеры использования

```typescript
import { atom } from '@nrgyjs/core';
import { observe, fromObservable } from '@nrgyjs/rxjs';
import { filter, interval } from 'rxjs';

// 1. Атом в Observable с фильтрацией
const count = atom(0);
const evenCount$ = observe(count).pipe(filter(v => v % 2 === 0));

// 2. Observable в Атом
const time = fromObservable(interval(1000), 0);

count.set(1); // evenCount$ проигнорирует
count.set(2); // evenCount$ выдаст 2
```

