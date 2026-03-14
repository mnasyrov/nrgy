# Пакет @nrgyjs/react

## Назначение пакета

Пакет `@nrgyjs/react` адаптирует примитивы Nrgy.js для React-приложений. Он
предоставляет хуки и HOC-обертки, которые связывают атомы, контроллеры и
view-model с деревом React-компонентов.

## Общая информация

Пакет покрывает два основных сценария интеграции:

1. Подписка React-компонентов на реактивное состояние через `useAtom()` и
   `useAtoms()`.
2. Построение MVC/MVVM-компонентов через `useController()`,
   `withViewController()`, `withViewModel()` и `NrgyControllerExtension`.

Благодаря этому UI может читать данные напрямую из Nrgy-атомов, а жизненный
цикл контроллеров и view-model остается согласованным с правилами
`@nrgyjs/core`.

## Установка пакета

```bash
npm install @nrgyjs/core @nrgyjs/react react
```

```bash
yarn add @nrgyjs/core @nrgyjs/react react
```

```bash
pnpm add @nrgyjs/core @nrgyjs/react react
```

## Концептуальная архитектура

Пакет строится вокруг деклараций из `@nrgyjs/core` и жизненного цикла React.

1. `useAtom()` подписывает компонент на один `Atom<T>`.
2. `useAtoms()` собирает объект атомов в один вычисляемый атом и сохраняет
   стабильность результата через структурное сравнение.
3. `useController()` создает экземпляр контроллера или view-model, связывает
   его с `ViewProxy`, обновляет входные props и корректно уничтожает ресурсы
   при размонтировании или замене декларации.
4. `NrgyControllerExtension` хранит в React Context список extension-provider'ов,
   которые участвуют в создании контроллера.
5. `withViewController()` и `withViewModel()` упрощают внедрение контроллера
   или view-model в пропсы React-компонента.

## Документация по функционалу

- [NrgyControllerExtension](./src/NrgyControllerExtension.ru.md): React Context
  для расширения контекста контроллера.
- [useAtom](./src/useAtom.ru.md): подписка компонента на один атом.
- [useAtoms](./src/useAtoms.ru.md): чтение нескольких атомов как одного
  объекта.
- [useController](./src/useController.ru.md): создание и сопровождение
  контроллеров и view-model в React.
- [withViewController](./src/withViewController.ru.md): HOC для внедрения
  контроллера в представление.
- [withViewModel](./src/withViewModel.ru.md): HOC для внедрения view-model в
  представление.

## Примеры использования

```tsx
import React from 'react';
import { declareController, readonlyAtom, withView } from '@nrgyjs/core';
import { useAtom, withViewController } from '@nrgyjs/react';

const CounterController = declareController()
  .extend(withView<{ initialValue: number }>())
  .apply(({ scope, view }) => {
    const value = scope.atom(view.props.initialValue());

    return {
      $value: readonlyAtom(value),
      increment: () => value.update((prev) => prev + 1),
    };
  });

const CounterView = withViewController(CounterController)(
  ({ controller, initialValue }) => {
    const value = useAtom(controller.$value);

    return (
      <button onClick={controller.increment}>
        Start: {initialValue}, current: {value}
      </button>
    );
  },
);
```

```tsx
import React from 'react';
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';
import { useAtoms, withViewModel } from '@nrgyjs/react';

const CounterViewModel = declareViewModel(({ scope, view }) => {
  const count = scope.atom(view.props.initialValue());

  return {
    state: { count: readonlyAtom(count) },
    increase: () => count.update((prev) => prev + 1),
  };
});

const Counter = withViewModel(CounterViewModel)(({ viewModel }) => {
  const { count } = useAtoms(viewModel.state);

  return <button onClick={viewModel.increase}>{count}</button>;
});
```

---

Translation: [EN](./README.md) | RU
