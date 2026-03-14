# `types.ts`

## Назначение файла

Модуль описывает публичные типы реактивного API `@nrgyjs/core`: атомы, эффекты,
опции и вспомогательные интерфейсы.

## Общая информация

Этот файл определяет TypeScript-контракты для функций `atom()`, `compute()`,
`effect()` и связанных утилит. Он важен для пользователей библиотеки, которые
строят свои абстракции поверх реактивного runtime и хотят сохранить строгую
типизацию.

## Концептуальная архитектура

Типы сгруппированы по ролям:

1. Контракты значений: `Atom<T>`, `DestroyableAtom<T>`, `SourceAtom<T>`.
2. Контракты вычислений: `Computation<T>`, `ComputeFn`, `ComputeOptions<T>`.
3. Контракты эффектов: `EffectCallback<T>`, `EffectSubscription`,
   `EffectFn`, `EffectOptions`.
4. Вспомогательные коллекции и обновления:
   `AtomList<TValues>`, `SourceAtomUpdates<TValue, TUpdates>`.

Модуль зависит от `ATOM_SYMBOL` и `ValueEqualityFn`, но сам не содержит
исполняемой логики.

## Описание публичного API

### `Atom<T>`

- Функция без аргументов, возвращающая текущее значение `T`.
- Маркирована внутренним `ATOM_SYMBOL` для распознавания в runtime.

### `DestroyableAtom<T>`

- Расширяет `Atom<T>` методом `destroy()`.

### `SourceAtom<T>`

- Расширяет `Atom<T>` методами `set`, `update`, `mutate`, `destroy`,
  `withUpdates`.

### `AtomOptions<T>`

- Опции `label`, `equal`, `onDestroy` для `atom()`.

### `ComputeOptions<T>`

- Опции `label` и `equal` для `compute()`.

### `EffectOptions`

- Опции `label`, `sync`, `onError`, `onDestroy`, `waitChanges`.

### `AtomFn`, `ComputeFn`, `EffectFn`

- Типы функций-конструкторов для атомов, вычислений и эффектов.

## Примеры использования

```ts
import type { Atom, EffectOptions, SourceAtom } from '@nrgyjs/core';

function connect(source: SourceAtom<number>, observer: (value: number) => void) {
  observer(source());
}

const options: EffectOptions = {
  label: 'logger',
  sync: true,
};
```

---

Translation: [EN](./types.md) | RU
