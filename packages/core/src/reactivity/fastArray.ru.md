# `fastArray.ts`

## Назначение файла

Модуль предоставляет компактные изменяемые структуры массивов, которые
внутренне используются реактивным runtime для быстрого учета зависимостей и
очередей задач.

## Общая информация

Runtime нужны контейнеры с минимальными аллокациями для ссылок на observers и
очередей scheduler'ов. `FastArray<T>` и `FastRingBuffer<T>` дают эти
низкоуровневые структуры без включения их в основной публичный API пакета.

## Концептуальная архитектура

Модуль содержит две внутренние структуры:

1. `FastArray<T>`: массив с логическим полем `size` и helper'ами для reset,
   dispose и быстрого `push` с учетом дублей.
2. `FastRingBuffer<T>`: циклическая очередь, кодирующая `size`, `capacity` и
   `head` в первых слотах tuple-backed массива.

Эти структуры используются в tracking зависимостей и в task scheduler'ах, чтобы
избежать лишних аллокаций и затрат на `Array.shift()`.

## Описание публичного API

### `FastArray<T>`

- Изменяемый массив с дополнительным полем `size`.

### `fastArray<T>(): FastArray<T>`

- Создает пустой fast array.

### `disposeFastArray<T>(array): void`

- Сбрасывает logical size и очищает backing storage.

### `resetFastArray<T>(array): void`

- Сбрасывает logical size без усечения уже выделенной памяти.

### `pushFastArray<T>(array, value): void`

- Добавляет значение с быстрым путем для исключения некоторых дублей.

### `FastRingBuffer<T>`

- Tuple-backed циклическая очередь со служебными слотами size/capacity/head.

### `fastRingBuffer<T>(initialCapacity?): FastRingBuffer<T>`

- Создает ring buffer с указанной или стандартной емкостью.

### `isEmptyFastRingBuffer<T>(ring): boolean`

- Возвращает `true`, если очередь пуста.

### `reserveFastRingBuffer<T>(ring, minCapacity): void`

- Увеличивает емкость ring buffer с сохранением логического порядка.

### `pushFastRingBuffer<T>(ring, value): void`

- Добавляет значение в хвост очереди.

### `shiftFastRingBuffer<T>(ring): T | undefined`

- Извлекает значение из головы очереди.

## Примеры использования

```ts
import { fastArray, pushFastArray } from './fastArray';

const items = fastArray<number>();
pushFastArray(items, 1);
pushFastArray(items, 2);
```
