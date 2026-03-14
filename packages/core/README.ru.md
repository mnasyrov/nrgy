# Пакет @nrgyjs/core

## Назначение пакета

Пакет `@nrgyjs/core` содержит базовые реактивные примитивы, механизмы
управления жизненным циклом и MVC/MVVM-абстракции, на которых строится
экосистема Nrgy.js.

## Общая информация

Пакет объединяет несколько уровней функциональности:

1. Реактивный runtime на основе `atom()`, `compute()` и `effect()`.
2. `Scope` для владения ресурсами и централизованного уничтожения.
3. Утилиты для композиции атомов и тестирования реактивных сценариев.
4. API контроллеров, представлений и view-model для архитектур MVC/MVVM.

Большинство остальных пакетов Nrgy.js используют именно эти базовые
контракты.

## Установка пакета

```bash
npm install @nrgyjs/core
```

```bash
yarn add @nrgyjs/core
```

```bash
pnpm add @nrgyjs/core
```

## Концептуальная архитектура

`@nrgyjs/core` разделен на несколько функциональных зон:

1. `common/*`: общие типы и стратегии сравнения значений.
2. `reactivity/*`: атомы, вычисления, эффекты и планировщики выполнения.
3. `scope/*`: границы жизненного цикла и сбор ресурсов.
4. `utils/*`: утилиты поверх атомов и эффектов.
5. `mvc/*`: декларации контроллеров, связки с view и инструменты для
   view-model.

## Документация по функционалу

- [defaultEquals](./src/common/defaultEquals.ru.md): стратегия сравнения по
  умолчанию.
- [objectEquals](./src/common/objectEquals.ru.md): структурное сравнение
  плоских объектов.
- [common/types](./src/common/types.ru.md): общие типы, включая
  `ValueEqualityFn`.
- [reactivity](./src/reactivity/reactivity.ru.md): основной API атомов,
  вычислений и эффектов.
- [reactivity/types](./src/reactivity/types.ru.md): публичные типы для атомов и
  эффектов.
- [createScope](./src/scope/createScope.ru.md): управление жизненным циклом
  ресурсов.
- [ScopeDestructionError](./src/scope/scopeDestructionError.ru.md): ошибка
  агрегированного разрушения.
- [scope/types](./src/scope/types.ru.md): общие контракты `Scope`.
- [createAtomSubject](./src/utils/atomSubject.ru.md): атом с каналами значений и
  ошибок.
- [batch](./src/utils/batch.ru.md): пакетное выполнение обновлений.
- [mapAtom](./src/utils/mapAtom.ru.md): преобразование атома в вычисляемый
  атом.
- [mergeAtoms](./src/utils/mergeAtoms.ru.md): объединение нескольких атомов.
- [readonlyAtom](./src/utils/readonlyAtom.ru.md): read-only представление
  атома.
- [runEffects](./src/utils/runEffects.ru.md): принудительный запуск очереди
  эффектов.
- [controller](./src/mvc/controller.ru.md): декларации контроллеров и
  extensions.
- [view](./src/mvc/view.ru.md): контракты для связки контроллера и
  представления.
- [viewModel](./src/mvc/viewModel.ru.md): декларации view-model.
- [viewProxy](./src/mvc/viewProxy.ru.md): реализация `ViewBinding` для тестов и
  адаптеров.
- [withView](./src/mvc/withView.ru.md): extension для передачи view в
  контроллер.

## Примеры использования

```ts
import { atom, compute, effect } from '@nrgyjs/core';

const count = atom(1);
const doubled = compute(() => count() * 2);

const subscription = effect(doubled, (value) => {
  console.log(value);
});

count.set(2);
subscription.destroy();
```

```ts
import { declareController } from '@nrgyjs/core';

const CounterController = declareController(({ scope }) => {
  const value = scope.atom(0);

  return {
    value,
    increase: () => value.update((prev) => prev + 1),
  };
});

const controller = new CounterController();
controller.increase();
controller.destroy();
```

