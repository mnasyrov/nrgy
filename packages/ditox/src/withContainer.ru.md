# `withContainer.ts`

## Назначение файла

Модуль реализует extension `withContainer()` и provider
`provideDependencyContainer()`, которые передают `ditox`-контейнер в контекст
контроллера.

## Общая информация

Этот модуль является базой для остальных DI-интеграций пакета. Если контейнер
не был передан, extension завершает создание контроллера ошибкой
`ControllerConstructorError`.

## Концептуальная архитектура

Модуль использует extension-механику `@nrgyjs/core`:

1. `DITOX_EXTENSION_CONTAINER_KEY` задает служебный ключ в extension params.
2. `withContainer()` извлекает по этому ключу `Container` и добавляет его в
   результирующий контекст.
3. `provideDependencyContainer(container)` формирует provider, который
   записывает контейнер в extension params при создании контроллера.

## Описание публичного API

### `DependencyContainerContext`

- Контекст контроллера с полем `container: Container`.

### `withContainer<TSourceContext>(): ExtensionFn<...>`

- Возвращает extension, который дополняет контекст полем `container`.
- Бросает `ControllerConstructorError`, если контейнер не был передан.

### `provideDependencyContainer(container): ExtensionParamsProvider`

- Упаковывает контейнер в provider для передачи в декларацию контроллера.

## Примеры использования

```ts
import { declareController } from '@nrgyjs/core';
import { createContainer } from 'ditox';
import { provideDependencyContainer, withContainer } from '@nrgyjs/ditox';

const Controller = declareController()
  .extend(withContainer())
  .apply(({ container }) => ({
    hasContainer: () => Boolean(container),
  }));

const container = createContainer();
const controller = new Controller([provideDependencyContainer(container)]);
```

