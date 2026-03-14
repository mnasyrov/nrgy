# `withViewController.tsx`

## Назначение файла

Модуль предоставляет HOC `withViewController()`, который автоматически создает
контроллер и передает его в React-компонент через prop `controller`.

## Общая информация

Этот модуль предназначен для React-представлений, которым нужен контроллер, но
не нужен прямой вызов `useController()` в каждом компоненте вручную. HOC
сохраняет декларативный стиль: пользователь описывает контроллер отдельно и
затем связывает его с визуальным компонентом.

## Концептуальная архитектура

`withViewController()` принимает `ControllerDeclaration`, возвращает фабрику HOC
и внутри обертки вызывает `useController(controllerDeclaration, props)`. После
этого исходный `ViewComponent` получает:

- все исходные `props`;
- дополнительный prop `controller` с экземпляром сервиса.

Таким образом HOC остается тонким адаптером поверх `useController()`.

## Описание публичного API

### `withViewController<TProps, TService>(controllerDeclaration)`

- `controllerDeclaration`: декларация контроллера, построенная для
  `ViewControllerContext<TProps>`.
- Возвращает функцию, которая принимает компонент вида
  `React.ComponentType<TProps & { controller: TService }>` и создает
  `FC<TProps>`.

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
      value: readonlyAtom(value),
      increase: () => value.update((prev) => prev + 1),
    };
  });

const CounterView = withViewController(CounterController)(
  ({ controller }) => {
    const value = useAtom(controller.value);

    return <button onClick={controller.increase}>{value}</button>;
  },
);
```

---

Translation: [EN](./withViewController.md) | RU
