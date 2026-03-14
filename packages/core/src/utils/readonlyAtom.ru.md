# `readonlyAtom.ts`

## Назначение файла

Модуль предоставляет функцию `readonlyAtom()`, создающую read-only представление
существующего атома.

## Общая информация

`readonlyAtom()` нужен для безопасной публикации состояния наружу. Он скрывает
методы изменения `SourceAtom`, но сохраняет реактивность и label исходного
атома.

## Концептуальная архитектура

Функция извлекает label через `getAtomLabel()` и создает вычисляемый атом
`compute(source, { label })`. Благодаря этому:

- сохраняется текущее значение источника;
- автоматически отслеживаются все обновления;
- наружу возвращается только интерфейс `Atom<T>` без методов записи.

## Описание публичного API

### `readonlyAtom<T>(source: Atom<T>): Atom<T>`

- `source`: исходный атом.
- Возвращает read-only атом, читающий значение из `source`.

## Примеры использования

```ts
import { atom, readonlyAtom } from '@nrgyjs/core';

const source = atom(1);
const exposed = readonlyAtom(source);

console.log(exposed()); // 1
source.set(2);
console.log(exposed()); // 2
```
