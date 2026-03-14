# Пакет @nrgyjs/ditox

## Назначение пакета

Пакет `@nrgyjs/ditox` интегрирует декларации контроллеров Nrgy.js с
DI-контейнером `ditox`.

## Общая информация

Пакет добавляет extensions, которые делают контейнер `ditox` доступным внутри
контроллеров и view-model. Также он предоставляет helper для адаптации
контроллеров с injections к конфигурации DI.

## Установка пакета

```bash
npm install @nrgyjs/core @nrgyjs/ditox ditox
```

```bash
yarn add @nrgyjs/core @nrgyjs/ditox ditox
```

```bash
pnpm add @nrgyjs/core @nrgyjs/ditox ditox
```

## Концептуальная архитектура

Пакет намеренно небольшой и целиком построен на extension-механизме из
`@nrgyjs/core`.

1. `withContainer()` добавляет активный `ditox`-контейнер в контекст
   контроллера.
2. `withInjections()` резолвит карту токенов из контейнера и публикует
   результат как `deps` в контексте контроллера.
3. `applyInjections()` адаптирует декларацию контроллера к функции, удобной
   для использования в DI-конфигурации.

## Документация по функционалу

- [applyInjections](./src/applyInjections.ru.md): адаптер из декларации
  контроллера в container-aware фабрику.
- [withContainer](./src/withContainer.ru.md): extension для передачи
  `ditox`-контейнера.
- [withInjections](./src/withInjections.ru.md): extension для резолва токенов в
  `deps`.

## Примеры использования

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

---

Translation: [EN](./README.md) | RU
