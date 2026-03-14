# Dependency Injection

## Назначение

Эта страница описывает основной путь dependency injection в Nrgy.js через
`ditox` и построенный поверх него React bridge.

## Основные API

`@nrgyjs/ditox`:

- `withContainer()`
- `withInjections()`
- `applyInjections()`

`@nrgyjs/ditox-react`:

- `DitoxNrgyExtension`

Это основной и рекомендуемый DI integration path для Nrgy.js.

## Когда использовать DI

DI подходит для инфраструктурных зависимостей, таких как:

- API clients
- loggers
- gateways
- analytics

DI не должен заменять явные feature inputs. Params и DI решают разные задачи.

## Инъекция зависимостей в controllers

`withInjections()` резолвит значения из активного container и отдаёт их в
controller logic через `deps`.

```ts
import { declareController } from '@nrgyjs/core';
import { withInjections } from '@nrgyjs/ditox';
import { token } from 'ditox';

const LOGGER = token<(message: string) => void>();

const LoggerController = declareController()
  .extend(withInjections({ log: LOGGER }))
  .apply(({ deps }) => ({
    write: (message: string) => deps.log(message),
  }));
```

## Wiring container

`withContainer()` является более низкоуровневым extension, который делает
активный `ditox` container доступным во время создания controller.

Его стоит использовать, когда:

- доступ к container должен быть передан явно
- controller creation происходит вне стандартного React bridge
- нужна кастомная композиция extensions

`applyInjections()` адаптирует injected controller declarations к форме,
удобной для container configuration, и помогает встроить их в DI wiring.

## React плюс Ditox

Если приложение уже использует `ditox` внутри React, `DitoxNrgyExtension`
является основным мостом между React tree и controller creation.

```tsx
import React from 'react';
import { DitoxNrgyExtension } from '@nrgyjs/ditox-react';

export function App() {
  return (
    <DitoxNrgyExtension>
      <FeatureRoot />
    </DitoxNrgyExtension>
  );
}
```

Так React controller creation остаётся согласованным с активным dependency
container, при этом DI не хардкодится в бизнес-логику.
