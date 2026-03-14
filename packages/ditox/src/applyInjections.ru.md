# `applyInjections.ts`

## Назначение файла

Модуль предоставляет функцию `applyInjections()`, которая адаптирует декларацию
контроллера с зависимостями к фабрике, принимающей `ditox`-контейнер.

## Общая информация

Эта утилита полезна при регистрации контроллеров в контейнере или при ручной
интеграции с DI-конфигурацией. Она избавляет от необходимости каждый раз
создавать `ExtensionParamsProvider` вручную.

## Концептуальная архитектура

`applyInjections()` является тонкой оберткой:

1. Принимает `ControllerDeclaration`, чей контекст уже предполагает наличие
   `deps`.
2. Возвращает функцию `(container) => service`.
3. Внутри создает экземпляр контроллера через `new controller([...providers])`,
   передавая provider, сформированный `provideDependencyContainer(container)`.

## Описание публичного API

### `applyInjections<TContext, TService>(controller): (container: Container) => TService`

- `controller`: декларация контроллера или view-model, использующая dependency
  injections.
- Возвращает фабрику, которая принимает `ditox`-контейнер и создает сервис.

## Примеры использования

```ts
import { applyInjections, withInjections } from '@nrgyjs/ditox';
import { declareController } from '@nrgyjs/core';
import { createContainer, token } from 'ditox';

const LOGGER = token<(message: string) => void>();

const Controller = declareController()
  .extend(withInjections({ log: LOGGER }))
  .apply(({ deps }) => ({
    write: () => deps.log('hello'),
  }));

const container = createContainer();
container.bindValue(LOGGER, (message) => {
  console.log(message);
});

const controller = applyInjections(Controller)(container);
controller.write();
controller.destroy();
```

---

Translation: [EN](./applyInjections.md) | RU
