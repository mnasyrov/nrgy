# `NrgyControllerExtension.tsx`

## Назначение файла

Модуль предоставляет React Context для передачи `ExtensionParamsProvider` вниз
по дереву компонентов и подключения этих provider'ов к создаваемым контроллерам.

## Общая информация

`NrgyControllerExtension` нужен в случаях, когда контроллеры должны получать
дополнительные параметры из React-окружения. Например, это полезно для
интеграции с DI-контейнером, пользовательским контекстом приложения или
другими расширениями `@nrgyjs/core`.

## Концептуальная архитектура

Модуль содержит два публичных элемента:

1. `useNrgyControllerExtensionContext()` читает накопленный список
   `ExtensionParamsProvider` из контекста.
2. `NrgyControllerExtension` берет родительский список provider'ов, добавляет в
   него текущий `provider` и передает результат дочернему поддереву.

Список provider'ов фиксируется через `useState()`. Это позволяет сохранить
стабильную последовательность provider'ов для потомков после первого рендера
компонента.

## Описание публичного API

### `useNrgyControllerExtensionContext(): ReadonlyArray<ExtensionParamsProvider>`

- Возвращает массив provider'ов, зарегистрированных в текущем дереве React.
- Используется в `useController()` при создании контроллера.

### `NrgyControllerExtension(props)`

- `provider`: функция типа `ExtensionParamsProvider`, которая расширяет набор
  параметров контроллера.
- `children`: дочерние React-элементы, для которых должен быть доступен этот
  provider.
- Возвращает React Provider, публикующий обновленный список extension-provider'ов.

## Примеры использования

```tsx
import React from 'react';
import { NrgyControllerExtension } from '@nrgyjs/react';

const addTenant = (params: Record<string, unknown>) => ({
  ...params,
  tenantId: 'tenant-1',
});

export function App() {
  return (
    <NrgyControllerExtension provider={addTenant}>
      <FeatureRoot />
    </NrgyControllerExtension>
  );
}
```
