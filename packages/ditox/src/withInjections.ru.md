# `withInjections.ts`

## Назначение файла

Модуль реализует extension `withInjections()`, которая резолвит набор зависимостей
из `ditox`-контейнера и добавляет их в контекст контроллера как `deps`.

## Общая информация

`withInjections()` используется поверх `withContainer()` или рядом с provider'ом
контейнера. Пользователь описывает объект токенов, а extension возвращает
объект значений той же структуры, доступный в factory контроллера или
view-model.

## Концептуальная архитектура

Модуль состоит из трех частей:

1. Типы `DependencyProps`, `DependencyTokenProps<Props>` и
   `DependencyContext<Dependencies>`.
2. Извлечение контейнера из extension params по ключу
   `DITOX_EXTENSION_CONTAINER_KEY`.
3. Резолв всех токенов через `resolveValues(container, tokens)` и добавление
   результата в поле `deps`.

Если контейнер отсутствует, модуль выбрасывает `ControllerConstructorError`.

## Описание публичного API

### `DependencyProps`

- Базовая форма объекта зависимостей.

### `DependencyTokenProps<Props>`

- Преобразует shape зависимостей в shape токенов `ditox`.

### `DependencyContext<Dependencies>`

- Контекст контроллера, дополненный полем `deps`.

### `withInjections<TSourceContext, Dependencies>(tokens): ExtensionFn<...>`

- `tokens`: объект токенов, которые нужно разрешить из контейнера.
- Возвращает extension, добавляющий `deps` в контекст контроллера.

## Примеры использования

```ts
import { declareController } from '@nrgyjs/core';
import { token } from 'ditox';
import { withInjections } from '@nrgyjs/ditox';

const API_URL = token<string>();

const Controller = declareController()
  .extend(withInjections({ apiUrl: API_URL }))
  .apply(({ deps }) => ({
    getApiUrl: () => deps.apiUrl,
  }));
```

