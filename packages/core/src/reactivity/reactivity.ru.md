# `reactivity.ts`

## Назначение файла

Модуль реализует основное реактивное ядро `@nrgyjs/core`: создание атомов,
вычисляемых атомов, эффектов и runtime, который управляет распространением
изменений.

## Общая информация

Именно этот файл задает поведение API `atom()`, `compute()`, `effect()`,
`syncEffect()`, `combineAtoms()`, а также вспомогательные функции вроде
`isAtom()` и `getAtomLabel()`. На этот runtime опираются все остальные уровни
пакета, включая `Scope`, MVC/MVVM и React-интеграции из соседних пакетов.

## Концептуальная архитектура

Внутренняя архитектура модуля состоит из нескольких уровней:

1. Узлы источников (`AtomNode`) хранят текущее значение, версию, стратегию
   сравнения и ссылки на наблюдателей.
2. Узлы вычислений (`ComputedNode`) лениво вычисляют значение и отслеживают
   зависимости через `RUNTIME.activeObserver`.
3. Узлы эффектов (`EffectNode`) подписываются на источники и планируются через
   синхронный или микротасковый scheduler.
4. `Runtime` управляет batch-контекстом, активным observer'ом и тремя
   очередями выполнения: sync, async и microtask.
5. Вспомогательные функции вроде `combineAtoms()` и `isAtom()` строятся поверх
   базовых атомарных примитивов.

Такой дизайн позволяет поддерживать ленивые вычисления, детерминированные
обновления и управление отложенными эффектами.

## Описание публичного API

### `atom<T>(initialValue, options?): SourceAtom<T>`

- `initialValue`: начальное значение источника.
- `options`: опции `label`, `equal`, `onDestroy`.
- Возвращает изменяемый атом с методами `set`, `update`, `mutate`, `destroy`,
  `withUpdates`.

### `compute<T>(computation, options?): Atom<T>`

- `computation`: чистая функция вычисления значения на основе других атомов.
- `options`: опции `label` и `equal`.
- Возвращает read-only вычисляемый атом.

### `effect(source, callback, options?): EffectSubscription`

- `source`: один атом или список атомов.
- `callback`: обработчик изменений.
- `options`: опции планирования и обработки ошибок.
- Создает асинхронный эффект и возвращает подписку с `destroy()`.

### `syncEffect(source, callback, options?): EffectSubscription`

- Аналог `effect()`, но планирует выполнение синхронно в пределах runtime.

### `combineAtoms<TValues>(sources): Atom<TValues>`

- Принимает кортеж атомов.
- Возвращает вычисляемый атом, который читает значения всех источников.

### `isAtom(value): boolean`

- Проверяет, является ли значение объектом/функцией Atom API.

### `getAtomLabel(source): string | undefined`

- Возвращает label атома, если он задан.

## Примеры использования

```ts
import { atom, compute, effect } from '@nrgyjs/core';

const price = atom(10);
const quantity = atom(2);
const total = compute(() => price() * quantity(), { label: 'total' });

const subscription = effect(total, (value) => {
  console.log('Total:', value);
});

price.set(12);
subscription.destroy();
```

```ts
import { atom, combineAtoms } from '@nrgyjs/core';

const first = atom('A');
const second = atom('B');
const both = combineAtoms([first, second]);

console.log(both()); // ['A', 'B']
```

---

Translation: [EN](./reactivity.md) | RU
