# `withView.ts`

## Назначение файла

Модуль реализует extension `withView()` и provider `provideView()`, через
которые контроллер получает `ViewBinding`.

## Общая информация

Этот файл связывает контроллерный runtime с UI-слоем. Он определяет тип
`ViewControllerContext`, умеет выводить props представления из контекста и
проверяет, что view действительно была передана в extension params.

## Концептуальная архитектура

Модуль строится вокруг extension-механизма из `controller.ts`:

1. `withView<TProps>()` возвращает `ExtensionFn`, которая извлекает
   `ViewBinding` по служебному ключу `NRGY_EXTENSION_VIEW_KEY`.
2. Если view отсутствует, выбрасывается `ControllerConstructorError`.
3. `provideView(view)` упаковывает объект view в `ExtensionParamsProvider`.
4. Типы `ViewControllerContext<TProps>` и
   `InferViewPropsFromControllerContext<TContext, ElseType>` формируют
   типобезопасный мост между контроллером и props view.

## Описание публичного API

### `ViewControllerContext<TProps>`

- Контекст контроллера, дополненный полем `view`.

### `InferViewPropsFromControllerContext<TContext, ElseType>`

- Извлекает тип props представления из контекста контроллера.

### `withView<TProps>(): ExtensionFn<BaseControllerContext, ViewControllerContext<TProps>>`

- Возвращает extension, который добавляет `view` в контекст контроллера.

### `provideView(view): ExtensionParamsProvider`

- Упаковывает `ViewBinding` в provider для передачи при создании контроллера.

## Примеры использования

```ts
import { declareController, provideView, withView, createViewProxy } from '@nrgyjs/core';

const GreetingController = declareController()
  .extend(withView<{ name: string }>())
  .apply(({ view }) => ({
    greet: () => `Hello, ${view.props.name()}!`,
  }));

const view = createViewProxy({ name: 'Ada' });
const controller = new GreetingController([provideView(view)]);
```
