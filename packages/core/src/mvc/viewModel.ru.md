# `viewModel.ts`

## Назначение файла

Модуль реализует декларативный API view-model в `@nrgyjs/core`, связывая
контроллерный механизм с props представления и реактивным состоянием.

## Общая информация

`declareViewModel()` строится поверх контроллерного API и `withView()`.
Результатом является view-model, которая обычно содержит:

- `props`: atom-представление входных props;
- `state`: atom-представление UI-состояния;
- методы действий и бизнес-логики.

Модуль поддерживает как функциональные, так и class-based view-model.

## Концептуальная архитектура

Внутренняя организация модуля такова:

1. `BaseViewModel` и `ViewModel<T>` описывают форму view-model.
2. `InferViewModelProps<T>` извлекает тип входных props из atom-поля `props`.
3. `BaseViewController` расширяет `BaseController` и публикует `view` и `props`
   как удобные поля класса.
4. `ViewModelDeclarationBuilder` автоматически добавляет `withView()` и
   создает декларацию через `apply()` или базовый класс через `getBaseClass()`.
5. `declareViewModel()` выступает как перегруженная точка входа: либо сразу
   принимает factory, либо возвращает builder.

Таким образом view-model переиспользует весь lifecycle контроллера, но при этом
остается типизированной относительно props представления.

## Описание публичного API

### Основные типы

- `BaseViewModel`: базовая форма view-model с опциональными `props` и `state`.
- `ViewModel<T>`: alias для конечного типа view-model.
- `InferViewModelProps<TViewModel>`: выводит shape props из `viewModel.props`.
- `ViewModelFactory<TContext, TViewModel>`: фабрика функциональной view-model.
- `ViewModelDeclaration<TViewModel, TContext>`: тип декларации view-model.
- `ViewModelClassDeclaration<TViewModel, TContext>`: тип class-based
  декларации.

### Классы и функции

- `BaseViewController<TViewModel, TContext>`: базовый класс для class-based
  view-model.
- `ViewModelDeclarationBuilder<TContext>`: builder декларации view-model.
- `declareViewModel(factory?)`: создает декларацию или builder.

## Примеры использования

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

const CounterViewModel = declareViewModel(({ scope, view }) => {
  const value = scope.atom(view.props.initialValue());

  return {
    state: { value: readonlyAtom(value) },
    increase: () => value.update((prev) => prev + 1),
  };
});
```
