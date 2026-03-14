# `withViewModel.tsx`

## Назначение файла

Модуль предоставляет HOC `withViewModel()`, который создает view-model и
передает ее в React-компонент через prop `viewModel`.

## Общая информация

`withViewModel()` ориентирован на MVVM-сценарии, где визуальный компонент
ожидает объект `viewModel` и, как правило, читает состояние через `useAtoms()`.
Модуль также экспортирует `withViewModelImpl()`, который используется как
внутренняя реализация и может быть полезен для расширений.

## Концептуальная архитектура

Модуль оборачивает `useController()` типизированной прослойкой для
`ViewModelDeclaration`.

1. `withViewModel()` принимает декларацию view-model и возвращает фабрику HOC.
2. `withViewModelImpl()` строит компонент-обертку, отделяет `children` от
   остальных props и передает оставшиеся props в `useController()`.
3. Результирующий компонент рендерит исходный `ViewComponent`, пробрасывая:
   `children`, исходные props и созданный `viewModel`.

Такой дизайн позволяет сохранить строгую типизацию `InferViewModelProps` и
избавляет пользователя от ручного приведения типов в каждом представлении.

## Описание публичного API

### `withViewModel<TViewModel>(viewModelDeclaration)`

- `viewModelDeclaration`: декларация view-model, совместимая с
  `ViewControllerContext<InferViewModelProps<TViewModel>>`.
- Возвращает функцию, которая принимает компонент с prop `viewModel` и создает
  HOC с автоматически выведенными props view-model.

### `withViewModelImpl(viewModelDeclaration, ViewComponent)`

- Внутренний помощник для построения HOC.
- Принимает декларацию view-model и React-компонент.
- Возвращает компонент, создающий `viewModel` через `useController()`.

## Примеры использования

```tsx
import React from 'react';
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';
import { useAtoms, withViewModel } from '@nrgyjs/react';

const CounterViewModel = declareViewModel(({ scope, view }) => {
  const value = scope.atom(view.props.initialValue());

  return {
    state: { value: readonlyAtom(value) },
    increase: () => value.update((prev) => prev + 1),
  };
});

const Counter = withViewModel(CounterViewModel)(({ viewModel }) => {
  const { value } = useAtoms(viewModel.state);

  return <button onClick={viewModel.increase}>{value}</button>;
});
```

---

Translation: [EN](./withViewModel.md) | RU
