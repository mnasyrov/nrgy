# `nextSafeInteger.ts`

## Назначение файла

Модуль предоставляет `nextSafeInteger()`, helper для инкремента идентификаторов
с сохранением внутри диапазона безопасных целых чисел JavaScript.

## Общая информация

Runtime использует монотонно меняющиеся числовые идентификаторы для внутренних
узлов. `nextSafeInteger()` увеличивает текущее значение до
`Number.MAX_SAFE_INTEGER`, после чего начинает заново с
`Number.MIN_SAFE_INTEGER`.

## Концептуальная архитектура

Функция реализует простое правило циклического перехода:

1. Если текущее значение меньше `Number.MAX_SAFE_INTEGER`, оно увеличивается.
2. Иначе последовательность продолжается с `Number.MIN_SAFE_INTEGER`.

Это позволяет избежать выхода в unsafe integer при сохранении детерминированной
последовательности идентификаторов.

## Описание публичного API

### `nextSafeInteger(value: number): number`

- `value`: текущий целочисленный идентификатор.
- Возвращает следующее безопасное целое число с циклическим переходом после
  `MAX_SAFE_INTEGER`.

## Примеры использования

```ts
import { nextSafeInteger } from './nextSafeInteger';

nextSafeInteger(1); // 2
nextSafeInteger(Number.MAX_SAFE_INTEGER); // Number.MIN_SAFE_INTEGER
```

---

Translation: [EN](./nextSafeInteger.md) | RU
