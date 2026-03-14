# `DitoxNrgyExtension.tsx`

## Назначение файла

Модуль предоставляет компонент `DitoxNrgyExtension`, который подключает
контейнер `ditox-react` к механизму создания контроллеров и view-model в
React-дереве Nrgy.

## Общая информация

Компонент нужен в приложениях, где контроллеры или view-model используют
`@nrgyjs/ditox`-extensions вроде `withContainer()` или `withInjections()`.
Он избавляет от ручной передачи `provideDependencyContainer()` в каждое место
создания контроллера.

## Концептуальная архитектура

Реализация строится как мост между тремя пакетами:

1. `useDependencyContainer()` получает активный контейнер из `ditox-react`.
2. `provideDependencyContainer(container)` записывает контейнер в extension
   params Nrgy.
3. `NrgyControllerExtension` публикует provider в React Context, откуда его
   забирает `useController()` из `@nrgyjs/react`.

Вспомогательный `DitoxInjectionParamsProvider` выполняется во время создания
контроллера и гарантирует, что DI-контейнер берется из актуального React
окружения.

## Описание публичного API

### `DitoxNrgyExtension: FC<PropsWithChildren>`

- `children`: React-поддерево, внутри которого контроллеры и view-model должны
  получать `ditox`-контейнер автоматически.
- Возвращает `NrgyControllerExtension` с provider, связывающим
  `ditox-react` и Nrgy.

## Примеры использования

```tsx
import React from 'react';
import { DitoxNrgyExtension } from '@nrgyjs/ditox-react';
import { CustomDependencyContainer } from 'ditox-react';

export function Root() {
  return (
    <CustomDependencyContainer container={container}>
      <DitoxNrgyExtension>
        <App />
      </DitoxNrgyExtension>
    </CustomDependencyContainer>
  );
}
```
